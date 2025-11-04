// Importaciones para implementar estrategia JWT de Passport
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { ConfigService } from "@nestjs/config";
import { Jwt } from "../interfaces/jwt.interface";

/**
 * @Injectable: Marca como proveedor inyectable
 * 
 * JwtStrategy: Estrategia Passport para validar tokens JWT
 * 
 * Extiende PassportStrategy(Strategy):
 * - PassportStrategy: Clase base de @nestjs/passport
 * - Strategy: Estrategia JWT de passport-jwt
 * 
 * ¿Qué hace esta clase?
 * Cuando un usuario envía un token JWT en una petición protegida:
 * 1. Extrae el token del header Authorization
 * 2. Verifica la firma con el secret
 * 3. Decodifica el payload
 * 4. Llama a validate() con el payload
 * 5. Si validate() retorna un objeto, ese objeto se adjunta a request.user
 * 6. Si validate() lanza excepción, la petición es rechazada
 * 
 * Flujo completo:
 * Cliente → Request con header: "Authorization: Bearer eyJhbG..." 
 *        → AuthGuard() intercepta
 *        → JwtStrategy extrae y verifica token
 *        → validate(payload) busca usuario en BD
 *        → Si todo OK, user se adjunta a request.user
 *        → Controlador puede acceder a request.user
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){

    /**
     * Constructor con inyección de dependencias
     * 
     * @InjectRepository(User): Inyecta Repository<User>
     * - Para buscar usuario en BD durante validación
     * 
     * ConfigService: Para leer JWT_SECRET del .env
     * 
     * super(): Llama al constructor de la clase padre (PassportStrategy)
     * Configura cómo extraer y verificar el token
     */
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private configService: ConfigService
    ){
        super({
            /**
             * secretOrKey: Clave secreta para verificar la firma del token
             * 
             * Debe ser la MISMA clave usada en JwtModule para firmar tokens
             * Si no coincide, la verificación fallará
             * 
             * configService.get('JWT_SECRET'):
             * - Lee JWT_SECRET del archivo .env
             * - DEBE ser un string, por eso el cast 'as string'
             * 
             * Proceso de verificación:
             * 1. Token tiene firma generada con secret
             * 2. JwtStrategy verifica firma con el mismo secret
             * 3. Si alguien modificó el token, la firma no coincidirá
             * 4. Si el secret es diferente, la verificación falla
             * 
             * Seguridad:
             * - NUNCA exponer el secret
             * - Usar secret diferente en cada ambiente
             * - Secret largo y aleatorio (min 32 caracteres)
             */
            secretOrKey: configService.get('JWT_SECRET') as string,
            
            /**
             * jwtFromRequest: Función que extrae el token del request
             * 
             * ExtractJwt.fromAuthHeaderAsBearerToken():
             * - Busca el header "Authorization"
             * - Espera formato: "Bearer eyJhbGciOiJIUzI1NiIsInR5..."
             * - Extrae solo la parte del token (sin "Bearer ")
             * 
             * Otras opciones disponibles:
             * - ExtractJwt.fromHeader('x-auth-token') - Token en header custom
             * - ExtractJwt.fromUrlQueryParameter('token') - Token en query param
             * - ExtractJwt.fromBodyField('token') - Token en body
             * 
             * Caso de uso estándar: Header Authorization con Bearer token
             * Ejemplo de header:
             * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
             */
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        })
    }


    /**
     * Método validate: Validación adicional después de verificar token
     * 
     * @param payload - Payload decodificado del token JWT
     * @returns Usuario completo de la base de datos
     * 
     * ¿Cuándo se llama?
     * - DESPUÉS de que Passport verifica la firma del token
     * - DESPUÉS de verificar que el token no expiró
     * - Si el token es válido, se decodifica y se pasa el payload aquí
     * 
     * Payload contiene:
     * - id: UUID del usuario
     * - email: Email del usuario
     * - iat: Timestamp de emisión
     * - exp: Timestamp de expiración
     * 
     * Proceso:
     * 1. Extrae id del payload
     * 2. Busca usuario en BD por id
     * 3. Verifica que el usuario existe
     * 4. Verifica que el usuario está activo
     * 5. Elimina password por seguridad
     * 6. Retorna usuario completo
     * 
     * TypeORM operation:
     * findOneBy({ id }):
     * SQL: SELECT * FROM user WHERE id = 'uuid';
     * 
     * Excepciones:
     * - UnauthorizedException: Token not valid
     *   Si el usuario fue eliminado de la BD pero el token aún no expiró
     * 
     * - UnauthorizedException: User is not active
     *   Si el usuario fue desactivado pero el token aún es válido
     * 
     * Objeto retornado:
     * Se adjunta automáticamente a request.user
     * En el controlador puedes acceder con @GetUser() decorator
     * 
     * Ejemplo:
     * Token payload: { id: "123", email: "user@test.com" }
     * BD consulta: Usuario completo con id, email, fullName, roles, etc.
     * request.user: { id: "123", email: "user@test.com", fullName: "Juan", roles: ["admin"] }
     * 
     * Caso de uso: Proteger rutas y tener acceso a datos completos del usuario
     */
    async validate(payload: Jwt): Promise<User> {
        const {id} = payload;
        
        // Buscar usuario en BD
        const user = await this.userRepository.findOneBy({id});

        // Verificar que el usuario existe
        if(!user) throw new UnauthorizedException(`Token not valid`);

        // Verificar que el usuario está activo
        if(!user.isActive) throw new UnauthorizedException(`User is not active`);

        // Eliminar password por seguridad
        delete user.password;

        // Retornar usuario (se adjunta a request.user)
        return user;
    }
    
}