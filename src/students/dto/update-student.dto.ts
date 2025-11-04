// Importación de utilidad de NestJS para crear DTOs parciales
import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentDto } from './create-student.dto';

/**
 * DTO para actualizar un estudiante
 * 
 * PartialType(CreateStudentDto):
 * Utilidad de NestJS que convierte todos los campos en opcionales
 * 
 * ¿Qué hace?
 * - Toma CreateStudentDto como base
 * - Hace que TODAS las propiedades sean opcionales
 * - Mantiene todas las validaciones de CreateStudentDto
 * 
 * Sin PartialType tendrías que escribir:
 * export class UpdateStudentDto {
 *   @IsString() @IsOptional() name?: string;
 *   @IsNumber() @IsOptional() age?: number;
 *   ... (repetir todos los campos)
 * }
 * 
 * Con PartialType, automáticamente:
 * - name es opcional pero si se envía, debe ser string
 * - age es opcional pero si se envía, debe ser número positivo
 * - email es opcional pero si se envía, debe ser email válido
 * 
 * Caso de uso: Actualizar solo ciertos campos del estudiante
 * 
 * Ejemplo 1 - Actualizar solo nombre:
 * PATCH /api/students/123
 * { "name": "Nuevo Nombre" }
 * 
 * Ejemplo 2 - Actualizar email y edad:
 * PATCH /api/students/123
 * { "email": "nuevo@email.com", "age": 21 }
 * 
 * Ejemplo 3 - Actualizar calificaciones:
 * PATCH /api/students/123
 * { "grades": [{ "subject": "Math", "grade": 5.0 }] }
 */
export class UpdateStudentDto extends PartialType(CreateStudentDto) {}

