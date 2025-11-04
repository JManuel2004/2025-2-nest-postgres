// Importaciones de TypeORM para definir la entidad y relaciones
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Student } from "./student.entity";

/**
 * @Entity: Marca esta clase como una entidad de TypeORM
 * 
 * Representa la tabla "grade" en la base de datos
 * Almacena las calificaciones de los estudiantes
 * 
 * Relación con Student: Muchos-a-Uno (Many-to-One)
 * Muchas calificaciones pueden pertenecer a un estudiante
 */
@Entity()
export class Grade{

    /**
     * @PrimaryGeneratedColumn('uuid')
     * 
     * Clave primaria con UUID autogenerado
     * Cada calificación tiene un ID único
     * 
     * El '?' hace que sea opcional en TypeScript (útil al crear nuevas grades)
     * TypeORM la genera automáticamente al guardar
     */
    @PrimaryGeneratedColumn('uuid')
    id?:string;

    /**
     * @Column('text')
     * 
     * Materia/asignatura de la calificación
     * Ejemplos: "Mathematics", "Science", "History"
     */
    @Column('text')
    subject:string;

    /**
     * @Column('text')
     * 
     * NOTA: Hay un error de tipo aquí
     * Debería ser type: 'float' o 'decimal' en lugar de 'text'
     * porque grade es un número, no texto
     * 
     * Calificación numérica del estudiante
     * Ejemplo: 4.5, 3.8, 5.0
     */
    @Column('text')
    grade:number;

    /**
     * @ManyToOne: Define una relación Muchos-a-Uno en TypeORM
     * 
     * Relación: MUCHAS calificaciones pertenecen a UN estudiante
     * 
     * Parámetros:
     * 1. () => Student: Entidad relacionada (Student)
     * 2. (student) => student.grade: Propiedad inversa en Student
     * 3. Opciones:
     *    - onDelete: 'CASCADE'
     *      ¿Qué hace?: Eliminación en cascada
     *      Si se elimina un Student, TODAS sus calificaciones se eliminan automáticamente
     * 
     * En la base de datos:
     * - Crea una columna "studentId" (Foreign Key) en la tabla grade
     * - Esta columna referencia al "id" de la tabla student
     * 
     * SQL equivalente:
     * ALTER TABLE grade ADD CONSTRAINT FK_student 
     * FOREIGN KEY (studentId) REFERENCES student(id) ON DELETE CASCADE
     * 
     * Caso de uso: Mantener integridad referencial
     * Si borras un estudiante, sus calificaciones huérfanas también se borran
     */
    @ManyToOne(
        () => Student,
        (student)=> student.grade,
        { onDelete: 'CASCADE'}
    )
    student?:Student;
}