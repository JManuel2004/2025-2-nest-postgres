// Importaciones necesarias de NestJS
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

/**
 * Función de arranque (bootstrap) de la aplicación NestJS
 * Esta función inicializa y configura la aplicación antes de escuchar peticiones HTTP
 * 
 * Uso: Se ejecuta automáticamente al iniciar la aplicación
 * Caso de uso: Configuración inicial del servidor, middlewares globales y validaciones
 */
async function bootstrap() {
  // Crea la instancia de la aplicación NestJS usando el módulo raíz (AppModule)
  const app = await NestFactory.create(AppModule);
  
  /**
   * Establece un prefijo global para todas las rutas de la API
   * Ejemplo: Si tienes una ruta /students, ahora será /api/students
   * Uso: Versionado de API y organización de endpoints
   */
  app.setGlobalPrefix('api')
  
  /**
   * Configura un ValidationPipe global para validar automáticamente los DTOs
   * whitelist: true - Elimina propiedades que no están definidas en el DTO
   *   Ejemplo: Si envías {name: "Juan", hacker: "malicious"} y el DTO solo tiene name, 
   *            la propiedad "hacker" será eliminada automáticamente
   * 
   * forbidNonWhitelisted: true - Lanza un error si se envían propiedades no permitidas
   *   Ejemplo: Con el mismo caso anterior, en lugar de eliminar silenciosamente,
   *            devuelve un error 400 indicando qué propiedades no están permitidas
   * 
   * Uso: Seguridad y validación de datos de entrada en todas las peticiones
   * Caso de uso: Prevenir inyección de datos no deseados y validar tipos de datos
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true
    })
  )
  
  /**
   * Inicia el servidor HTTP en el puerto especificado
   * Lee el puerto de las variables de entorno o usa 3000 por defecto
   * Caso de uso: Producción (PORT desde env) vs Desarrollo (3000 por defecto)
   */
  await app.listen(process.env.PORT ?? 3000);
}

// Ejecuta la función de arranque
bootstrap();
