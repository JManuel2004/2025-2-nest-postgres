// Importaciones de NestJS para crear decoradores personalizados
import { createParamDecorator, ExecutionContext, InternalServerErrorException } from "@nestjs/common";
import * as request from 'supertest';

/**
 * @GetUser: Decorador personalizado para extraer el usuario del request
 * 
 * ¿Qué es un decorador personalizado?
 * - Función que extrae datos del contexto de ejecución
 * - Se usa como parámetro en métodos de controladores
 * - Simplifica el acceso a datos comunes
 * 
 * createParamDecorator((data, context) => { ... }):
 * - data: Parámetro opcional que se pasa al decorador
 * - context: ExecutionContext que contiene info del request HTTP
 * 
 * Uso en controlador:
 * @Get('profile')
 * @UseGuards(AuthGuard())
 * getProfile(@GetUser() user: User) {
 *   return user; // Usuario ya autenticado
 * }
 * 
 * Sin este decorador tendrías que hacer:
 * getProfile(@Req() request: Request) {
 *   const user = request.user;
 *   if (!user) throw new Error(...);
 *   return user;
 * }
 * 
 * Ventajas:
 * - Código más limpio y legible
 * - Validación centralizada
 * - Type-safety con TypeScript
 * - Reutilizable en múltiples endpoints
 */
export const GetUser = createParamDecorator(
    (data, context: ExecutionContext) =>{
        /**
         * context.switchToHttp().getRequest():
         * Convierte el contexto genérico a contexto HTTP
         * Extrae el objeto request de Express
         * 
         * request.user:
         * Objeto usuario adjuntado por JwtStrategy.validate()
         * Solo existe si el request pasó por AuthGuard()
         * 
         * Flujo:
         * 1. Cliente envía request con token JWT
         * 2. AuthGuard() intercepta
         * 3. JwtStrategy extrae y valida token
         * 4. JwtStrategy.validate() retorna usuario
         * 5. Passport adjunta usuario a request.user
         * 6. @GetUser() extrae request.user
         * 7. Controlador recibe usuario como parámetro
         */
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        
        /**
         * Validación de seguridad:
         * Si no hay usuario en el request, algo salió mal
         * 
         * Causas posibles:
         * - No se usó @UseGuards(AuthGuard()) en la ruta
         * - El guard no ejecutó correctamente
         * - Error en la configuración de Passport
         * 
         * InternalServerErrorException:
         * Error 500 porque es un error del servidor, no del cliente
         * El cliente hizo todo bien, pero el servidor está mal configurado
         */
        if(!user) throw new InternalServerErrorException(`User not found`);

        /**
         * Retornar usuario completo
         * El controlador recibe este objeto como parámetro
         * 
         * Objeto típico:
         * {
         *   id: "uuid",
         *   email: "user@example.com",
         *   fullName: "Juan Pérez",
         *   isActive: true,
         *   roles: ["admin", "teacher"]
         * }
         * 
         * Nota: password ya fue eliminado en JwtStrategy.validate()
         */
        return user;
    }
)

/**
 * Uso avanzado con data parameter:
 * 
 * Si quisieras extraer solo un campo específico:
 * 
 * export const GetUser = createParamDecorator(
 *   (data: string, context: ExecutionContext) => {
 *     const user = context.switchToHttp().getRequest().user;
 *     return data ? user[data] : user;
 *   }
 * );
 * 
 * Entonces podrías hacer:
 * getProfile(@GetUser('email') email: string) {
 *   return email; // Solo el email
 * }
 * 
 * getProfile(@GetUser('id') id: string) {
 *   return id; // Solo el ID
 * }
 * 
 * getProfile(@GetUser() user: User) {
 *   return user; // Usuario completo
 * }
 */