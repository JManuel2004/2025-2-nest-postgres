// Importaciones de NestJS para manejo de excepciones y logging
import { Injectable, InternalServerErrorException, Logger, NotFoundException, ParseUUIDPipe } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { DataSource, Repository } from 'typeorm';
import { PaginationDto } from './dto/pagination.dto';
import { isUUID } from 'class-validator';
import { Grade } from './entities/grade.entity';

/**
 * @Injectable: Decorador que marca esta clase como un proveedor inyectable
 * 
 * Permite que esta clase sea inyectada en otros componentes mediante el sistema DI de NestJS
 * Caso de uso: El controlador inyecta este servicio para usar su lógica de negocio
 */
@Injectable()
export class StudentsService {
  /**
   * Logger de NestJS para registrar eventos y errores
   * Útil para debugging y monitoreo en producción
   * 
   * Uso: this.logger.error('mensaje'), this.logger.log('info')
   */
  private logger = new Logger('StudentsService')

  /**
   * Constructor con inyección de dependencias
   * 
   * @InjectRepository(Grade): Inyecta el repositorio de Grade
   * Repository<Grade>: Patrón de TypeORM para operaciones CRUD en la tabla 'grade'
   * 
   * @InjectRepository(Student): Inyecta el repositorio de Student
   * Repository<Student>: Para operaciones CRUD en la tabla 'student'
   * 
   * DataSource: Representa la conexión a la base de datos
   * Usado para transacciones y operaciones avanzadas como QueryRunner
   * 
   * Caso de uso: Estos repositorios permiten interactuar con la BD sin escribir SQL
   */
  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly dataSource: DataSource
  ){}

  /**
   * Crea un nuevo estudiante con sus calificaciones
   * 
   * @param createStudentDto - Datos validados del estudiante
   * 
   * Proceso:
   * 1. Desestructura grades del resto de datos del estudiante
   * 2. Crea instancia de Student (sin guardar aún)
   * 3. Crea instancias de Grade asociadas
   * 4. Guarda todo (cascade:true guarda grades automáticamente)
   * 
   * Operaciones TypeORM:
   * - create(): Crea instancia sin guardar en BD
   * - save(): INSERT en la base de datos
   * 
   * SQL generado aproximadamente:
   * BEGIN;
   * INSERT INTO student (name, age, email...) VALUES (...);
   * INSERT INTO grade (subject, grade, studentId) VALUES (...);
   * COMMIT;
   */
  async create(createStudentDto: CreateStudentDto) {
    try{
      const { grades = [], ...studentDetails} = createStudentDto;
      
      // create() crea una instancia sin guardar en BD
      const student = this.studentRepository.create({
        ...studentDetails,
        // map() convierte cada grade del DTO en una instancia de Grade entity
        grade: grades.map(grade => this.gradeRepository.create(grade))
      });
      
      // save() ejecuta INSERT (cascade:true también guarda las grades)
      await this.studentRepository.save(student);
      return student;
    }catch(error){
      this.handleException(error);
    }
  }

  /**
   * Obtiene todos los estudiantes con paginación
   * 
   * @param paginationDto - Límite y offset para paginación
   * 
   * Operaciones TypeORM:
   * - find(): SELECT en la base de datos
   * - take: LIMIT en SQL (cuántos registros)
   * - skip: OFFSET en SQL (desde qué registro empezar)
   * 
   * SQL generado:
   * SELECT * FROM student LIMIT {limit} OFFSET {offset};
   * 
   * Ejemplo: limit=10, offset=20
   * Resultado: Registros del 21 al 30
   * 
   * Caso de uso: Listar estudiantes página por página (evita cargar miles de registros)
   */
  async findAll(paginationDto: PaginationDto) {
    try{
      const {limit, offset} = paginationDto;
      return await this.studentRepository.find({
        take: limit,    // LIMIT
        skip: offset    // OFFSET
      });
    }catch(error){
      this.handleException(error);
    }
  }

  /**
   * Busca un estudiante por ID, nombre o nickname
   * 
   * @param term - Puede ser UUID, nombre o nickname
   * 
   * Lógica:
   * 1. Si term es UUID → busca por ID
   * 2. Si no → busca por nombre o nickname
   * 
   * Operaciones TypeORM:
   * 
   * findOneBy({ id }):
   * SQL: SELECT * FROM student WHERE id = 'uuid';
   * 
   * createQueryBuilder():
   * Constructor de consultas SQL de manera programática
   * Más flexible que find() para consultas complejas
   * 
   * where('UPPER(name)=:name or nickname=:nickname', { name, nickname }):
   * SQL: SELECT * FROM student WHERE UPPER(name) = 'NAME' OR nickname = 'nickname';
   * - :name y :nickname son parámetros (previene SQL injection)
   * 
   * leftJoinAndSelect('student.grade', 'studentGrades'):
   * SQL: LEFT JOIN grade ON grade.studentId = student.id
   * - Carga las calificaciones del estudiante
   * - 'studentGrades' es el alias de la tabla grade
   * 
   * getOne():
   * Ejecuta la query y devuelve un solo resultado
   * 
   * Caso de uso: Búsqueda flexible por diferentes criterios
   */
  async findOne(term: string) {
    let student : Student | null;

    if(isUUID(term)){
      // Búsqueda simple por ID
      student = await this.studentRepository.findOneBy({id: term})
    }else{
      // Búsqueda avanzada con QueryBuilder
      const queryBuilder = this.studentRepository.createQueryBuilder('student');
      student = await queryBuilder.where('UPPER(name)=:name or nickname=:nickname',{
        name: term.toUpperCase(),
        nickname: term.toLowerCase()
      })
      .leftJoinAndSelect('student.grade', 'studentGrades')
      .getOne()
    }

    if(!student)
      throw new NotFoundException(`Student with ${term} not found`);

    return student;
  }

  /**
   * Actualiza un estudiante existente
   * 
   * @param id - UUID del estudiante
   * @param updateStudentDto - Datos a actualizar (parciales)
   * 
   * Proceso complejo con TRANSACCIÓN:
   * 
   * 1. preload({ id, ...datos }):
   *    - Busca el estudiante por ID
   *    - Carga sus datos actuales
   *    - Aplica los cambios del DTO
   *    - NO guarda aún en BD
   * 
   * 2. QueryRunner - Sistema de transacciones de TypeORM:
   *    ¿Qué es una transacción?
   *    - Conjunto de operaciones que se ejecutan como una unidad
   *    - Si una falla, TODAS se revierten (rollback)
   *    - Si todas tienen éxito, se confirman (commit)
   * 
   *    ¿Por qué necesitamos transacción aquí?
   *    - Vamos a ELIMINAR las grades viejas
   *    - Y luego INSERTAR las grades nuevas
   *    - Si falla la inserción, no queremos que se hayan borrado las viejas
   * 
   * Flujo de la transacción:
   * 
   * a) createQueryRunner(): Crea un "runner" de consultas
   * b) connect(): Establece conexión a BD
   * c) startTransaction(): BEGIN TRANSACTION en SQL
   * 
   * d) Si hay nuevas grades:
   *    - queryRunner.manager.delete(Grade, { student: { id } })
   *      DELETE FROM grade WHERE studentId = 'id';
   *    - Crea nuevas instancias de Grade
   * 
   * e) queryRunner.manager.save(student):
   *    UPDATE student SET ... WHERE id = 'id';
   *    INSERT INTO grade (...) VALUES (...);
   * 
   * f) commitTransaction(): COMMIT en SQL (confirma cambios)
   * g) release(): Libera la conexión
   * 
   * Si hay error:
   * - rollbackTransaction(): ROLLBACK en SQL (revierte todo)
   * - release(): Libera la conexión
   * 
   * Caso de uso: Actualizar estudiante y reemplazar todas sus calificaciones de forma segura
   * Sin transacción: Podrías quedar con estudiante sin calificaciones si algo falla
   */
  async update(id: string, updateStudentDto: UpdateStudentDto) {

    const {grades, ...studentDetails} = updateStudentDto;

    // preload: Carga entidad existente y aplica cambios (no guarda)
    const student = await this.studentRepository.preload({
      id:id,
      ...studentDetails
    })

    if(!student) throw new NotFoundException(`Student with id ${id} not found`);

    // Crear QueryRunner para transacción
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try{
      // Si se enviaron nuevas calificaciones
      if(grades){
        // Eliminar todas las calificaciones existentes del estudiante
        await queryRunner.manager.delete(Grade, {student:{id}});
        // Crear las nuevas calificaciones
        student.grade = grades.map(grade => this.gradeRepository.create(grade))
      }

      // Guardar estudiante (y sus nuevas grades por cascade:true)
      await queryRunner.manager.save(student);
      
      // Confirmar transacción (hace permanentes los cambios)
      await queryRunner.commitTransaction();
      
      // Liberar conexión
      await queryRunner.release();

      // Devolver estudiante actualizado con sus relaciones
      return this.findOne(id);
      
    }catch(error){
      // Si algo falla, revertir TODOS los cambios
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      this.handleException(error);
    }
  }

  /**
   * Elimina un estudiante
   * 
   * @param id - UUID del estudiante
   * 
   * Proceso:
   * 1. Busca el estudiante (lanza error si no existe)
   * 2. Lo elimina con remove()
   * 
   * remove() vs delete():
   * - remove(): Recibe una entidad, dispara hooks como @BeforeRemove
   * - delete(): Recibe condiciones, más rápido pero no dispara hooks
   * 
   * SQL generado:
   * DELETE FROM student WHERE id = 'uuid';
   * (Las grades se eliminan automáticamente por onDelete: 'CASCADE')
   */
  async remove(id: string) {
    const student = await this.findOne(id);
    await this.studentRepository.remove(student);
  }

  /**
   * Elimina TODOS los estudiantes de la base de datos
   * 
   * PELIGROSO: Usa con cuidado, típicamente solo para testing/seeding
   * 
   * createQueryBuilder():
   * Crea un constructor de consultas
   * 
   * delete().where({}).execute():
   * SQL: DELETE FROM student; (sin WHERE, borra TODO)
   * 
   * Caso de uso: Resetear BD en desarrollo, popular datos de prueba
   * NO usar en producción sin confirmación
   */
  deleteAllStudents(){
    const query = this.studentRepository.createQueryBuilder();
    try{
      return query.delete()
                        .where({})
                        .execute();
    }catch(error){
      this.handleException(error);
    }
  }

  /**
   * Manejo centralizado de excepciones
   * 
   * @param error - Error capturado de TypeORM
   * 
   * error.code === '23505':
   * Código de error de PostgreSQL para violación de UNIQUE constraint
   * Ejemplo: Intentar insertar un email que ya existe
   * 
   * error.detail:
   * Contiene el mensaje específico: "Key (email)=(test@test.com) already exists"
   * 
   * Caso de uso: Convertir errores técnicos de BD en mensajes amigables
   */
  private handleException(error){
    this.logger.error(error);
    if(error.code === '23505')
        throw new InternalServerErrorException(error.detail)
  }
}
