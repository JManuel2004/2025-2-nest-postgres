// Importaciones de NestJS para crear decoradores personalizados
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @RawHeaders: Decorador personalizado para extraer headers HTTP raw
 * 
 * ¿Qué son raw headers?
 * - Array con todos los headers HTTP en formato crudo
 * - Incluye tanto nombres como valores de headers
 * - Formato: ['Header-Name', 'valor', 'Otro-Header', 'otro-valor', ...]
 * 
 * createParamDecorator((data, context) => { ... }):
 * - Crea un decorador de parámetro personalizado
 * - data: Parámetro opcional (no usado aquí)
 * - context: Contexto de ejecución del request
 * 
 * Uso en controlador:
 * @Get('info')
 * getInfo(@RawHeaders() headers: string[]) {
 *   console.log(headers);
 *   // ['host', 'localhost:3000', 'user-agent', 'Mozilla/5.0', ...]
 *   return headers;
 * }
 * 
 * Ejemplo de raw headers:
 * [
 *   'host', 'localhost:3000',
 *   'connection', 'keep-alive',
 *   'content-type', 'application/json',
 *   'authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   'user-agent', 'Mozilla/5.0...',
 *   'accept', '*\/*'
 * ]
 * 
 * Casos de uso:
 * - Logging de requests completos
 * - Debugging de problemas de headers
 * - Auditoría de peticiones
 * - Verificar headers customizados
 * - Análisis de tráfico
 * 
 * Diferencia con @Headers():
 * @Headers() devuelve objeto: { host: 'localhost', 'user-agent': 'Mozilla...' }
 * @RawHeaders() devuelve array: ['host', 'localhost', 'user-agent', 'Mozilla...']
 */
export const RawHeaders = createParamDecorator(
    (data, context: ExecutionContext) => {
        /**
         * context.switchToHttp().getRequest():
         * Convierte contexto genérico a contexto HTTP
         * Extrae el objeto request de Express
         * 
         * request.rawHeaders:
         * Propiedad de Node.js HTTP request
         * Contiene headers en formato raw/crudo
         * Array de strings alternando nombre-valor
         * 
         * return request.rawHeaders:
         * El controlador recibe este array como parámetro
         */
        const request = context.switchToHttp().getRequest();
        return request.rawHeaders;
    }
)

/**
 * Ejemplo práctico de uso:
 * 
 * @Controller('test')
 * export class TestController {
 *   
 *   @Get('headers')
 *   @UseGuards(AuthGuard())
 *   testHeaders(
 *     @RawHeaders() rawHeaders: string[],
 *     @Headers() headers: Record<string, string>
 *   ) {
 *     console.log('Raw:', rawHeaders);
 *     console.log('Parsed:', headers);
 *     
 *     // Buscar header específico en raw headers
 *     const authIndex = rawHeaders.indexOf('authorization');
 *     if (authIndex !== -1) {
 *       const token = rawHeaders[authIndex + 1];
 *       console.log('Token:', token);
 *     }
 *     
 *     return { rawHeaders, headers };
 *   }
 * }
 */