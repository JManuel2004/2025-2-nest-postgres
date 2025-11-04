// Importaciones de NestJS para definir módulo
import { Module } from '@nestjs/common';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { StudentsModule } from 'src/students/students.module';

/**
 * @Module: Módulo de seeding (población inicial de datos)
 * 
 * SeedModule: Módulo para cargar datos de prueba en la base de datos
 * 
 * ¿Qué es seeding?
 * - Proceso de insertar datos iniciales/de prueba en la BD
 * - Útil para desarrollo, testing y demos
 * - Permite tener datos consistentes entre desarrolladores
 * 
 * Propósito de este módulo:
 * - Poblar la base de datos con estudiantes de prueba
 * - Resetear datos a un estado conocido
 * - Facilitar desarrollo sin crear datos manualmente
 * 
 * Caso de uso:
 * - Desarrollo: Tener datos de prueba listos
 * - Testing: Estado inicial consistente para tests
 * - Demos: Mostrar funcionalidad con datos realistas
 * - CI/CD: Datos de prueba automáticos
 */
@Module({
  /**
   * controllers: Controlador que expone endpoint de seeding
   * 
   * SeedController: Maneja peticiones para ejecutar el seed
   * GET /api/seed → ejecuta el proceso de seeding
   */
  controllers: [SeedController],
  
  /**
   * providers: Servicios del módulo
   * 
   * SeedService: Contiene la lógica de seeding
   * - Elimina estudiantes existentes
   * - Crea estudiantes desde datos predefinidos
   * - Maneja el proceso completo de población
   */
  providers: [SeedService],
  
  /**
   * imports: Módulos necesarios
   * 
   * StudentsModule: Importado para usar StudentsService
   * 
   * ¿Por qué importar StudentsModule?
   * - SeedService necesita crear estudiantes
   * - StudentsModule exporta StudentsService
   * - Sin esta importación, no podríamos inyectar StudentsService
   * 
   * Reutilización de lógica:
   * En lugar de duplicar código de creación de estudiantes,
   * reutilizamos StudentsService.create() y .deleteAllStudents()
   * 
   * Arquitectura limpia:
   * SeedModule → usa → StudentsService → usa → Repository → PostgreSQL
   * 
   * Beneficios:
   * - No duplicar código
   * - Validaciones consistentes (mismos DTOs)
   * - Misma lógica de negocio
   * - Cambios en Students se reflejan automáticamente en Seed
   */
  imports:[StudentsModule]
})
export class SeedModule {}

/**
 * Flujo de uso del SeedModule:
 * 
 * 1. Developer inicia la aplicación
 * 2. Base de datos está vacía o con datos viejos
 * 3. Developer hace: GET http://localhost:3000/api/seed
 * 4. SeedController.executeSeed() se ejecuta
 * 5. SeedService.runSeed() se ejecuta:
 *    a. studentsService.deleteAllStudents() - Limpia tabla
 *    b. Lee datos de seed-student.data.ts
 *    c. studentsService.create() para cada estudiante
 * 6. Base de datos ahora tiene datos de prueba
 * 7. Developer puede probar endpoints con datos reales
 * 
 * ⚠️ ADVERTENCIA:
 * Este endpoint NO debe estar disponible en producción
 * Elimina TODOS los estudiantes
 * 
 * Buenas prácticas:
 * - Desactivar seed en producción
 * - Proteger con guard que solo permita en desarrollo
 * - Usar variable de entorno: if (process.env.NODE_ENV === 'development')
 * - O eliminar completamente en build de producción
 */
