// Importaciones de class-validator para validación de datos
import {IsString, IsNumber, IsEmail, IsIn, IsArray, IsPositive, IsOptional} from 'class-validator'
import { Grade } from '../entities/grade.entity';

/**
 * DTO (Data Transfer Object): Objeto de transferencia de datos
 * 
 * ¿Qué es un DTO?
 * - Define la estructura de datos que se espera recibir en una petición HTTP
 * - Valida automáticamente los datos usando decoradores de class-validator
 * - Proporciona type-safety en TypeScript
 * 
 * Caso de uso: Validar datos antes de crear un estudiante
 * Si los datos no cumplen las reglas, NestJS devuelve error 400 automáticamente
 * 
 * Ejemplo de request válido:
 * POST /api/students
 * {
 *   "name": "Juan Pérez",
 *   "age": 20,
 *   "email": "juan@example.com",
 *   "gender": "Male",
 *   "subjects": ["Math", "Science"]
 * }
 */
export class CreateStudentDto {
   
        /**
         * @IsString: Valida que sea una cadena de texto
         * Rechaza: números, booleanos, null, undefined, objetos
         * 
         * name: Nombre completo del estudiante
         * Obligatorio (no tiene @IsOptional)
         */
        @IsString()
        name: string;
    
        /**
         * @IsNumber: Valida que sea un número
         * @IsPositive: Valida que sea mayor que 0
         * @IsOptional: Campo opcional (puede no enviarse)
         * 
         * age: Edad del estudiante
         * Si no se envía, será undefined (nullable:true en la entidad permite esto)
         * 
         * Ejemplo válido: 20, 25, 18
         * Ejemplo inválido: -5, 0, "veinte"
         */
        @IsNumber()
        @IsPositive()
        @IsOptional()
        age: number;
    
        /**
         * @IsString: Valida que sea string
         * @IsEmail: Valida formato de email
         * 
         * email: Email del estudiante (debe ser único)
         * Formato válido: usuario@dominio.com
         * 
         * Ejemplo válido: "test@gmail.com"
         * Ejemplo inválido: "notanemail", "test@", "@test.com"
         */
        @IsString()
        @IsEmail()
        email:string;
       
         /**
          * @IsString: Valida que sea string
          * @IsIn(['Male', 'Female', 'Other']): Valida que sea uno de estos valores exactos
          * 
          * gender: Género del estudiante
          * Solo permite estos 3 valores
          * 
          * Ejemplo válido: "Male", "Female", "Other"
          * Ejemplo inválido: "M", "male" (case-sensitive), "Otro"
          */
         @IsString()
         @IsIn(['Male', 'Female', 'Other'])
        gender: string;

        /**
         * @IsArray: Valida que sea un array
         * 
         * subjects: Materias que cursa el estudiante
         * Array de strings
         * 
         * Ejemplo válido: ["Math", "Science", "History"]
         * Ejemplo inválido: "Math" (no es array), ["Math", 123] (contiene número)
         */
        @IsArray()
        subjects: string[];

        /**
         * @IsArray: Valida que sea un array
         * @IsOptional: Campo opcional
         * 
         * grades: Calificaciones del estudiante
         * Array de objetos Grade
         * 
         * Si se envía, se crearán las calificaciones junto con el estudiante
         * Si no se envía, el estudiante se crea sin calificaciones
         * 
         * Ejemplo:
         * "grades": [
         *   { "subject": "Math", "grade": 4.5 },
         *   { "subject": "Science", "grade": 4.0 }
         * ]
         */
        @IsArray()
        @IsOptional()
        grades: Grade[];
}
