// Importaciones de TypeORM para definir la entidad
import {BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import { Grade } from './grade.entity';

/**
 * @Entity: Decorador de TypeORM que marca esta clase como una entidad de base de datos
 * 
 * ¿Qué es una Entidad en TypeORM?
 * - Es una clase que se mapea a una tabla en la base de datos
 * - Cada instancia de la clase representa una fila en la tabla
 * - Cada propiedad de la clase representa una columna en la tabla
 * 
 * Uso: Definir la estructura de datos que se almacenará en PostgreSQL
 * Caso de uso: Esta entidad crea la tabla "student" en la base de datos
 */
@Entity()
export class Student {

    /**
     * @PrimaryGeneratedColumn: Define la clave primaria de la tabla
     * 
     * 'uuid': Tipo de clave primaria
     * - UUID (Universal Unique Identifier): Genera IDs únicos como "550e8400-e29b-41d4-a716-446655440000"
     * - Alternativas: 'increment' (1, 2, 3...), 'rowid'
     * 
     * Ventajas UUID:
     * - No se pueden predecir (más seguro)
     * - Útil para sistemas distribuidos
     * - No hay colisiones entre diferentes bases de datos
     * 
     * Caso de uso: Identificar de manera única cada estudiante
     */
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /**
     * @Column: Define una columna en la base de datos
     * 
     * 'text': Tipo de dato en PostgreSQL
     * - Almacena cadenas de texto de longitud variable sin límite
     * - Alternativas: 'varchar', 'char', 'int', 'boolean', 'timestamp', etc.
     * 
     * Uso: Almacenar el nombre del estudiante
     */
    @Column('text')
    name: string;

    /**
     * @Column con configuración de objeto
     * 
     * type: 'int' - Número entero en PostgreSQL
     * nullable: true - Permite valores NULL (el campo es opcional)
     * 
     * Sin nullable o nullable: false, el campo sería obligatorio (NOT NULL en SQL)
     * 
     * Caso de uso: La edad puede no estar disponible al crear un estudiante
     */
    @Column({
        type: 'int',
        nullable: true
    })
    age: number;

    /**
     * @Column con unique constraint
     * 
     * unique: true - Crea un índice único en la base de datos
     * Garantiza que no haya dos estudiantes con el mismo email
     * 
     * TypeORM automáticamente:
     * - Crea un índice en esta columna (búsquedas más rápidas)
     * - Lanza error si intentas insertar un email duplicado
     * 
     * Caso de uso: Emails deben ser únicos para identificar usuarios
     */
    @Column({
        type: 'text',
        unique: true
    })
    email:string;

    /**
     * Nickname del estudiante
     * Se genera automáticamente con @BeforeInsert si no se proporciona
     */
    @Column('text')
    nickname: string;

    /**
     * Género del estudiante
     * Validación en el DTO asegura que solo sea 'Male', 'Female' o 'Other'
     */
    @Column('text')
    gender: string;

    /**
     * @Column con array
     * 
     * array: true - Columna de tipo array en PostgreSQL
     * PostgreSQL soporta nativamente arrays (no todas las BD lo hacen)
     * 
     * Almacena múltiples valores: ['Math', 'Science', 'History']
     * 
     * Alternativa sin arrays: Crear una tabla separada "student_subjects" (más normalizado)
     * 
     * Caso de uso: Lista de materias que cursa el estudiante
     * Ventaja: Simplicidad para listas pequeñas
     * Desventaja: Difícil hacer búsquedas complejas por materia
     */
    @Column({
        type: 'text',
        array: true
    })
    subjects: string[]

    /**
     * @OneToMany: Define una relación Uno-a-Muchos en TypeORM
     * 
     * Relación: Un estudiante puede tener MUCHAS calificaciones
     * 
     * Parámetros:
     * 1. () => Grade: Tipo de la entidad relacionada (lazy loading)
     * 2. (grade) => grade.student: Cómo acceder de vuelta desde Grade a Student
     * 3. Opciones:
     *    - cascade: true
     *      ¿Qué hace?: Operaciones en Student se propagan a Grade
     *      Ejemplo: Al guardar un Student con grades, las grades se guardan automáticamente
     *      Ejemplo: Al eliminar un Student, sus grades también se eliminan
     * 
     *    - eager: true
     *      ¿Qué hace?: Carga automáticamente las relaciones al buscar Student
     *      Sin eager: student.grade sería undefined hasta hacer .find({ relations: ['grade'] })
     *      Con eager: student.grade ya viene cargado automáticamente
     * 
     * Caso de uso: Obtener estudiante con todas sus calificaciones en una sola consulta
     * SQL generado: SELECT student.*, grade.* FROM student LEFT JOIN grade ON grade.studentId = student.id
     */
    @OneToMany(
        ()=> Grade,
        (grade) => grade.student,
        {cascade: true, eager: true}
    )
    grade?: Grade[]

    /**
     * @BeforeInsert: Hook/Lifecycle de TypeORM
     * 
     * Se ejecuta AUTOMÁTICAMENTE antes de insertar un nuevo registro
     * 
     * Uso: Transformar o validar datos antes de guardar
     * Caso de uso: Generar nickname automáticamente si no se proporciona
     * 
     * Ejemplo:
     * Input: { name: "Juan Perez", age: 20 }
     * Output en DB: { name: "Juan Perez", age: 20, nickname: "juan_perez20" }
     */
    @BeforeInsert()
    checkNicknameInsert(){
        // Si no hay nickname, usar el nombre como base
        if(!this.nickname){
            this.nickname = this.name
        }

        // Transformar a minúsculas, reemplazar espacios por guiones bajos y agregar edad
        this.nickname = this.nickname.toLowerCase()
                        .replace(" ", "_")
                        +this.age;
    }

    /**
     * @BeforeUpdate: Hook/Lifecycle de TypeORM
     * 
     * Se ejecuta AUTOMÁTICAMENTE antes de actualizar un registro existente
     * 
     * Uso: Mantener consistencia de datos al actualizar
     * Caso de uso: Si cambia el nombre o edad, el nickname se actualiza automáticamente
     * 
     * Ejemplo:
     * Update: { age: 21 } (cambió la edad)
     * El nickname se regenera: "juan_perez21"
     */
    @BeforeUpdate()
    checkNicknameUpdate(){
        this.nickname = this.nickname.toLowerCase()
                        .replace(" ", "_")
                        +this.age;
    }

}
