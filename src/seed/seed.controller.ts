// Importaciones de NestJS para crear controlador
import { Controller, Get } from '@nestjs/common';
import { SeedService } from './seed.service';

/**
 * @Controller('seed'): Controlador de seeding
 * 
 * Prefijo de ruta: /api/seed
 * Expone endpoints para poblar la base de datos con datos de prueba
 * 
 * ⚠️ IMPORTANTE: Solo para desarrollo/testing
 * NUNCA usar en producción (elimina todos los datos)
 */
@Controller('seed')
export class SeedController {
    /**
     * Inyección del servicio de seeding
     * Delega toda la lógica al servicio
     */
    constructor(private readonly seedService: SeedService){}

    /**
     * @Get(): Endpoint GET para ejecutar el seed
     * 
     * Ruta: GET /api/seed
     * Propósito: Poblar/resetear base de datos con datos de prueba
     * 
     * Proceso:
     * 1. Llama a seedService.runSeed()
     * 2. Elimina todos los estudiantes existentes
     * 3. Inserta estudiantes predefinidos desde seed-student.data.ts
     * 4. Retorna mensaje de confirmación
     * 
     * Ejemplo de request:
     * GET http://localhost:3000/api/seed
     * 
     * Respuesta exitosa (200 OK):
     * "SEED EXECUTED"
     * 
     * Uso típico:
     * - Developer clona el repositorio
     * - Corre npm install y docker-compose up
     * - Base de datos está vacía
     * - Developer ejecuta GET /api/seed
     * - Ahora tiene datos de prueba para trabajar
     * 
     * Casos de uso:
     * - Resetear BD a estado inicial conocido
     * - Probar funcionalidad con datos consistentes
     * - Demos con datos realistas
     * - Testing: Estado inicial para tests E2E
     * 
     * ⚠️ PELIGRO:
     * - Elimina TODOS los estudiantes existentes
     * - No hay confirmación ni rollback
     * - Ejecutar solo en desarrollo
     * 
     * Mejoras recomendadas:
     * - Proteger con guard: solo en modo desarrollo
     * - Requerir autenticación de admin
     * - Agregar parámetro de confirmación
     * - Desactivar completamente en producción
     * 
     * Ejemplo de protección:
     * @Get()
     * @UseGuards(AuthGuard(), AdminGuard)
     * executeSeed() {
     *   if (process.env.NODE_ENV === 'production') {
     *     throw new ForbiddenException('Seed not allowed in production');
     *   }
     *   return this.seedService.runSeed();
     * }
     */
    @Get()
    executeSeed(){
        return this.seedService.runSeed();
    }
}
