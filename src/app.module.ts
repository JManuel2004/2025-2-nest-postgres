// Importaciones necesarias de NestJS y módulos personalizados
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsModule } from './students/students.module';
import { SeedModule } from './seed/seed.module';
import { AuthModule } from './auth/auth.module';

/**
 * @Module: Decorador que marca esta clase como un módulo de NestJS
 * Los módulos son la unidad básica de organización en NestJS
 * 
 * AppModule es el módulo raíz de la aplicación que coordina todos los demás módulos
 */
@Module({
  imports: [
    /**
     * ConfigModule: Maneja las variables de entorno (.env)
     * forRoot(): Hace que las variables de entorno estén disponibles globalmente
     * 
     * Uso: Leer configuraciones sensibles como DB_HOST, DB_PASSWORD, JWT_SECRET
     * Caso de uso: Separar configuraciones entre desarrollo y producción
     */
    ConfigModule.forRoot(),
    
    /**
     * TypeOrmModule: Integración de TypeORM con NestJS
     * TypeORM es un ORM (Object-Relational Mapping) que permite trabajar con bases de datos
     * usando objetos de JavaScript/TypeScript en lugar de SQL puro
     * 
     * forRoot(): Configura la conexión principal a la base de datos
     * 
     * CONFIGURACIONES TYPEORM:
     */
    TypeOrmModule.forRoot({
      /**
       * type: Tipo de base de datos
       * Opciones: 'postgres', 'mysql', 'mariadb', 'sqlite', 'mongodb', etc.
       * Caso de uso: Postgres es ideal para aplicaciones empresariales con relaciones complejas
       */
      type: 'postgres',
      
      /**
       * host: Dirección del servidor de base de datos
       * Ejemplo: 'localhost' en desarrollo, URL del servidor en producción
       */
      host: process.env.DB_HOST,
      
      /**
       * port: Puerto de conexión a la base de datos
       * El operador +! convierte el string a número (puerto por defecto de Postgres: 5432)
       * Nota: Hay un error aquí, debería ser +process.env.DB_PORT (sin el !)
       */
      port: +!process.env.DB_PORT,
      
      /**
       * database: Nombre de la base de datos a usar
       * Ejemplo: 'students_db', 'myapp_production'
       */
      database: process.env.DB_NAME,
      
      /**
       * username: Usuario de la base de datos
       * Caso de uso: 'postgres' en desarrollo, usuario específico en producción
       */
      username: process.env.DB_USERNAME,
      
      /**
       * password: Contraseña del usuario de base de datos
       * IMPORTANTE: Nunca hardcodear, siempre usar variables de entorno
       */
      password: process.env.DB_PASSWORD,
      
      /**
       * autoLoadEntities: true
       * Carga automáticamente todas las entidades registradas en los módulos
       * Sin esto, tendrías que listar manualmente cada entidad en un array 'entities'
       * 
       * Uso: Evita tener que importar cada entidad individualmente
       * Ejemplo: Student, Grade, User se cargan automáticamente
       */
      autoLoadEntities: true,
      
      /**
       * synchronize: true
       * CRÍTICO: Sincroniza automáticamente el esquema de la base de datos con las entidades
       * 
       * ¿Qué hace?
       * - Crea tablas automáticamente basándose en las entidades
       * - Agrega columnas nuevas si modificas una entidad
       * - Modifica tipos de datos si cambias la definición
       * 
       * ⚠️ PELIGRO EN PRODUCCIÓN:
       * - Puede ELIMINAR datos si cambias la estructura
       * - Puede BORRAR columnas que ya no existen en la entidad
       * - NO usar en producción, solo en desarrollo
       * 
       * En producción usar: MIGRACIONES (archivos que controlan cambios de esquema)
       * Caso de uso desarrollo: Prototipado rápido, pruebas, aprendizaje
       * Caso de uso producción: synchronize: false + migraciones con typeorm migration:run
       */
      synchronize: true //Solo usarla en ambientes bajos, en prod hacer migraciones
    }),
    
    /**
     * Módulos de la aplicación:
     * Cada módulo encapsula una funcionalidad específica
     */
    StudentsModule,  // Gestión de estudiantes (CRUD)
    SeedModule,      // Población inicial de datos de prueba
    AuthModule,      // Autenticación y autorización de usuarios
  ],
  
  /**
   * controllers: Controladores del módulo raíz (vacío porque cada módulo tiene los suyos)
   * providers: Servicios del módulo raíz (vacío porque cada módulo tiene los suyos)
   */
  controllers: [],
  providers: [],
})
export class AppModule {}
