/**
 * Interface para el payload del token JWT
 * 
 * Define la estructura de datos que se codificará en el token
 * 
 * ¿Qué es un payload JWT?
 * - Datos que se incluyen dentro del token
 * - Se codifican en Base64 (no encriptados, solo codificados)
 * - Cualquiera puede decodificar y leer el payload
 * - La firma garantiza que no fue modificado
 * 
 * IMPORTANTE: NO incluir datos sensibles en el payload
 * - NO incluir passwords
 * - NO incluir números de tarjeta
 * - NO incluir información privada sensible
 * 
 * Incluir solo datos de identificación necesarios
 * 
 * Uso: Crear y validar tokens JWT
 * Caso de uso: jwtService.sign(payload), validate(payload)
 */
export interface Jwt {
    /**
     * id: UUID del usuario
     * 
     * Identificador único del usuario en la base de datos
     * Se usa en JwtStrategy.validate() para buscar el usuario completo
     * 
     * Ejemplo: "550e8400-e29b-41d4-a716-446655440000"
     */
    id:string;
    
    /**
     * email: Email del usuario
     * 
     * Incluido por conveniencia y para debugging
     * Permite identificar rápidamente qué usuario tiene el token
     * 
     * Ejemplo: "usuario@example.com"
     */
    email:string;
}

/**
 * Nota sobre campos adicionales automáticos:
 * 
 * Cuando se genera el token con jwtService.sign(payload),
 * automáticamente se agregan:
 * 
 * - iat (issued at): Timestamp de cuándo se creó el token
 *   Ejemplo: 1636489200
 * 
 * - exp (expiration): Timestamp de cuándo expira el token
 *   Ejemplo: 1636492800 (1 hora después si expiresIn: '1h')
 * 
 * Estos campos los agrega automáticamente @nestjs/jwt
 * No necesitas incluirlos en esta interface
 */

