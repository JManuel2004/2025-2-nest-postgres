// Importaciones de validadores de class-validator
import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

/**
 * DTO para login de usuarios
 * 
 * Uso: Autenticación de usuarios existentes
 * Caso de uso: POST /api/auth/login
 * 
 * Ejemplo de request:
 * {
 *   "email": "usuario@example.com",
 *   "password": "password123"
 * }
 * 
 * Respuesta exitosa:
 * {
 *   "id": "uuid",
 *   "email": "usuario@example.com",
 *   "fullName": "Juan Pérez",
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 */
export class LoginDto{
    /**
     * @IsString: Valida que sea string
     * @IsEmail: Valida formato de email
     * 
     * email: Email del usuario para autenticación
     * 
     * Debe coincidir con un email registrado en la BD
     * La búsqueda es case-insensitive (gracias a @BeforeInsert en User entity)
     * 
     * Ejemplo: "usuario@example.com"
     */
    @IsString()
    @IsEmail()
    email:string;

    /**
     * @IsString: Valida que sea string
     * @MinLength(6): Mínimo 6 caracteres
     * @MaxLength(50): Máximo 50 caracteres
     * 
     * password: Contraseña en texto plano
     * 
     * Se comparará con el hash almacenado usando bcrypt
     * Las mismas validaciones que en CreateUserDto
     * 
     * Ejemplo: "password123"
     * 
     * Proceso de validación:
     * 1. Validar formato (min 6, max 50)
     * 2. Buscar usuario por email
     * 3. Comparar bcrypt.compareSync(password, user.password)
     * 4. Si coincide, generar token JWT
     * 5. Si no coincide, lanzar UnauthorizedException
     */
    @IsString()
    @MinLength(6)
    @MaxLength(50)
    password:string;
}