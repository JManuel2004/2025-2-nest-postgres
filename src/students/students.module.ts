// Importaciones de NestJS y TypeORM
import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Grade } from './entities/grade.entity';

/**
 * @Module: Decorador que define un módulo de NestJS
 * 
 * StudentsModule: Módulo que encapsula toda la funcionalidad relacionada con estudiantes
 * Incluye: CRUD de estudiantes, gestión de calificaciones
 */
@Module({
  /**
   * controllers: Array de controladores del módulo
   * 
   * Controladores manejan las peticiones HTTP y definen las rutas
   * StudentsController maneja rutas como:
   * - POST /api/students (crear)
   * - GET /api/students (listar)
   * - GET /api/students/:id (obtener uno)
   * - PATCH /api/students/:id (actualizar)
   * - DELETE /api/students/:id (eliminar)
   */
  controllers: [StudentsController],
  
  /**
   * imports: Módulos necesarios para este módulo
   * 
   * TypeOrmModule.forFeature([Student, Grade]):
   * Registra las entidades Student y Grade en este módulo
   * 
   * ¿Qué hace forFeature()?
   * - Crea un Repository<Student> inyectable
   * - Crea un Repository<Grade> inyectable
   * 
   * Repository es el patrón de TypeORM para hacer operaciones de BD:
   * - studentRepository.find() - SELECT * FROM student
   * - studentRepository.save() - INSERT o UPDATE
   * - studentRepository.remove() - DELETE
   * 
   * Sin esto, no podrías usar @InjectRepository(Student) en el servicio
   * 
   * Caso de uso: Permitir que StudentsService interactúe con las tablas student y grade
   */
  imports:[
    TypeOrmModule.forFeature([Student, Grade])
  ],
  
  /**
   * providers: Servicios y proveedores del módulo
   * 
   * StudentsService: Contiene la lógica de negocio
   * Se inyecta en StudentsController para ser usado
   * 
   * Patrón de inyección de dependencias:
   * Controller → llama a → Service → llama a → Repository → Base de datos
   */
  providers: [StudentsService],
  
  /**
   * exports: Hace que StudentsService esté disponible para otros módulos
   * 
   * Exportado porque: SeedModule necesita usarlo para insertar datos de prueba
   * 
   * Sin exports: Otros módulos no podrían importar StudentsModule y usar StudentsService
   * Con exports: SeedModule puede hacer:
   *   imports: [StudentsModule]
   *   constructor(private studentsService: StudentsService) {}
   * 
   * Caso de uso: Reutilización de lógica entre módulos
   */
  exports: [StudentsService]
})
export class StudentsModule {}
