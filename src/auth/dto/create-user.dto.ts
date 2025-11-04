// Importaciones de validadores de class-validator
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

/**
 * DTO para crear un nuevo usuario
 * 
 * Uso: Registro de nuevos usuarios en el sistema
 * Caso de uso: POST /api/auth/register
 * 
 * Ejemplo de request:
 * {
 *   "email": "usuario@example.com",
 *   "fullName": "Juan Pérez García",
 *   "password": "password123"
 * }
 */
export class CreateUserDto {
    /**
     * @IsEmail: Valida formato de email
     * @IsString: Valida que sea string
     * 
     * email: Email del usuario (será único en BD)
     * 
     * Validaciones:
     * - Debe ser email válido: usuario@dominio.com
     * - Debe ser string
     * - Campo obligatorio
     * 
     * Ejemplos válidos: "test@gmail.com", "user@company.co.uk"
     * Ejemplos inválidos: "notanemail", "test@", "@test.com"
     */
    @IsEmail()
    @IsString()
    email:string;

    /**
     * @IsString: Valida que sea string
     * 
     * fullName: Nombre completo del usuario
     * 
     * Sin validaciones de longitud (puede ser cualquier string)
     * Campo obligatorio
     * 
     * Ejemplos: "Juan Pérez", "María García López"
     */
    @IsString()
    fullName:string;

    /**
     * @IsString: Valida que sea string
     * @MinLength(6): Mínimo 6 caracteres
     * @MaxLength(50): Máximo 50 caracteres
     * 
     * password: Contraseña del usuario
     * 
     * Validaciones de seguridad:
     * - Mínimo 6 caracteres (previene contraseñas muy débiles)
     * - Máximo 50 caracteres (previene ataques DoS)
     * 
     * La contraseña se hasheará con bcrypt antes de guardar
     * Nunca se almacena en texto plano
     * 
     * Ejemplos válidos: "password123", "MiContraseña2024!"
     * Ejemplos inválidos: "12345" (muy corta), "a" (muy corta)
     * 
     * Buenas prácticas adicionales (no implementadas aquí):
     * - Requerir mayúsculas y minúsculas
     * - Requerir números
     * - Requerir caracteres especiales
     * - Validar contra lista de contraseñas comunes
     */
    @IsString()
    @MinLength(6)
    @MaxLength(50)
    password:string;

}
