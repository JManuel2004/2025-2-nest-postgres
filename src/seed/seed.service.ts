// Importaciones de NestJS y entidades
import { Injectable } from '@nestjs/common';
import { StudentsService } from '../students/students.service';
import { initialData } from './data/seed-student.data';
import { Student } from 'src/students/entities/student.entity';

/**
 * @Injectable: Servicio de seeding
 * 
 * SeedService: Contiene la lógica para poblar la BD con datos de prueba
 * 
 * Responsabilidades:
 * - Leer datos de prueba desde archivos
 * - Eliminar datos existentes
 * - Insertar datos nuevos
 * - Manejar el proceso completo de seeding
 */
@Injectable()
export class SeedService {

    /**
     * Inyección de StudentsService
     * 
     * ¿Por qué inyectar StudentsService?
     * - Reutilizar lógica de creación de estudiantes
     * - Mantener validaciones consistentes
     * - Usar los mismos DTOs y entidades
     * - No duplicar código
     * 
     * StudentsService proporciona:
     * - create(): Crear estudiante con validaciones
     * - deleteAllStudents(): Eliminar todos los estudiantes
     */
    constructor(private readonly studentsService: StudentsService){}


    /**
     * runSeed: Método principal de seeding
     * 
     * Ejecuta el proceso completo de población de datos
     * 
     * Proceso:
     * 1. Llama a insertNewStudents()
     * 2. Retorna mensaje de confirmación
     * 
     * Return: 'SEED EXECUTED'
     * Indica que el proceso terminó exitosamente
     * 
     * Uso: Llamado desde SeedController
     * GET /api/seed → runSeed() → 'SEED EXECUTED'
     */
    async runSeed(){
        await this.insertNewStudents();
        return 'SEED EXECUTED';
    }

    /**
     * insertNewStudents: Inserta estudiantes de prueba
     * 
     * Proceso detallado:
     * 1. Elimina todos los estudiantes existentes
     * 2. Lee datos de initialData.students
     * 3. Crea promesas de inserción para cada estudiante
     * 4. Ejecuta todas las inserciones en paralelo
     * 5. Retorna true cuando completa
     * 
     * TypeORM operations usadas:
     * - deleteAllStudents(): DELETE FROM student;
     * - create(): INSERT INTO student ... para cada estudiante
     * 
     * initialData.students:
     * Array de objetos con estructura de Student
     * Definido en seed-student.data.ts
     * 
     * Ejemplo de datos:
     * [
     *   {
     *     name: "Gus",
     *     age: 33,
     *     email: "gus@gmail.com",
     *     subjects: ["math", "P.E"],
     *     gender: "Male",
     *     grades: [...]
     *   },
     *   ...
     * ]
     */
    async insertNewStudents(){
        // Paso 1: Eliminar estudiantes existentes
        // SQL: DELETE FROM student WHERE {};
        // Limpia la tabla completamente
        await this.studentsService.deleteAllStudents();
        
        // Paso 2: Obtener array de estudiantes de prueba
        const students = initialData.students;

        // Paso 3: Crear array de promesas
        // Cada promesa representa la inserción de un estudiante
        const insertPromises : Promise<Student | undefined>[] = [];

        /**
         * forEach vs map:
         * Usamos forEach para iterar y push a array externo
         * 
         * Para cada estudiante en los datos de prueba:
         * - Llama a studentsService.create(student)
         * - create() valida datos, crea instancia, guarda en BD
         * - Retorna Promise<Student>
         * - Push la promesa al array
         * 
         * ¿Por qué no ejecutar inmediatamente?
         * Queremos ejecutar todas las inserciones en PARALELO
         * No una por una (sería más lento)
         */
        students.forEach(student => {
            insertPromises.push(this.studentsService.create(student));
        })

        /**
         * Promise.all(insertPromises):
         * Ejecuta todas las promesas en PARALELO
         * 
         * ¿Qué hace Promise.all?
         * - Toma array de promesas
         * - Ejecuta todas simultáneamente
         * - Espera a que TODAS se completen
         * - Si UNA falla, todo falla (fail-fast)
         * - Retorna array con resultados
         * 
         * Ventajas:
         * - Mucho más rápido que secuencial
         * - 10 estudiantes en paralelo vs uno por uno
         * 
         * Desventajas:
         * - Si una falla, todas se cancelan
         * - Más carga en la BD (muchas conexiones simultáneas)
         * 
         * SQL generado (aproximado):
         * BEGIN;
         * INSERT INTO student (name, age, ...) VALUES ('Gus', 33, ...);
         * INSERT INTO student (name, age, ...) VALUES ('Valentina', 21, ...);
         * ... (todas en paralelo)
         * COMMIT;
         * 
         * Caso de uso:
         * Insertar 10-20 estudiantes: Rápido y eficiente
         * Insertar 10000 estudiantes: Mejor hacerlo en lotes
         */
        await Promise.all(insertPromises);
        
        return true;
    }

}

/**
 * Mejoras posibles:
 * 
 * 1. Inserción por lotes (bulk insert):
 * async insertNewStudents() {
 *   await this.studentsService.deleteAllStudents();
 *   const students = initialData.students;
 *   
 *   // Insertar todos a la vez (más eficiente)
 *   await this.studentRepository.insert(students);
 * }
 * 
 * 2. Manejo de errores:
 * try {
 *   await this.insertNewStudents();
 *   return 'SEED EXECUTED';
 * } catch (error) {
 *   this.logger.error('Seed failed', error);
 *   throw new InternalServerErrorException('Seed failed');
 * }
 * 
 * 3. Seed condicional:
 * async runSeed() {
 *   if (process.env.NODE_ENV === 'production') {
 *     throw new ForbiddenException('Cannot seed in production');
 *   }
 *   await this.insertNewStudents();
 *   return 'SEED EXECUTED';
 * }
 * 
 * 4. Seed de múltiples entidades:
 * async runSeed() {
 *   await this.insertNewStudents();
 *   await this.insertNewUsers();
 *   await this.insertNewGrades();
 *   return 'SEED EXECUTED';
 * }
 */
