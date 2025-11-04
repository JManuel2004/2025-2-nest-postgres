// Importaciones de NestJS, TypeORM y Passport para autenticación
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * @Module: Módulo de autenticación
 * 
 * Responsabilidades:
 * - Registro de usuarios
 * - Login (autenticación)
 * - Generación de tokens JWT
 * - Validación de tokens
 * - Protección de rutas
 * 
 * Stack de autenticación:
 * - Passport: Framework de autenticación para Node.js
 * - JWT (JSON Web Token): Tokens stateless para autenticación
 * - Bcrypt: Hash de contraseñas
 */
@Module({
  controllers: [AuthController],
  
  imports:[
    /**
     * TypeOrmModule.forFeature([User])
     * 
     * Registra la entidad User en este módulo
     * Permite inyectar Repository<User> en AuthService
     * 
     * Sin esto: No podrías hacer @InjectRepository(User)
     * Con esto: Puedes hacer operaciones CRUD en la tabla user
     */
    TypeOrmModule.forFeature([User]),
    
    /**
     * PassportModule.register({ defaultStrategy: 'jwt' })
     * 
     * Configura Passport con estrategia JWT por defecto
     * 
     * ¿Qué es Passport?
     * - Middleware de autenticación para Node.js
     * - Soporta múltiples estrategias: JWT, Local, OAuth, Google, Facebook, etc.
     * 
     * defaultStrategy: 'jwt'
     * - Usa JWT como estrategia predeterminada
     * - Permite usar @UseGuards(AuthGuard()) sin especificar estrategia
     * - Si tuvieras múltiples estrategias, podrías hacer @UseGuards(AuthGuard('jwt'))
     * 
     * Caso de uso: Proteger rutas con @UseGuards(AuthGuard())
     */
    PassportModule.register({defaultStrategy: 'jwt'}),
    
    /**
     * JwtModule.registerAsync()
     * 
     * Configura el módulo JWT de manera asíncrona
     * Permite usar variables de entorno desde ConfigService
     * 
     * ¿Por qué registerAsync?
     * - Necesitamos acceso a ConfigService para leer JWT_SECRET del .env
     * - register() normal no permite inyección de dependencias
     * - registerAsync() permite usar useFactory con inyección
     * 
     * imports: [ConfigModule]
     * - Importa ConfigModule para acceder a variables de entorno
     * 
     * inject: [ConfigService]
     * - Inyecta ConfigService en la función useFactory
     * 
     * useFactory: (configService: ConfigService) => {...}
     * - Función que devuelve la configuración JWT
     * - Se ejecuta cuando se inicializa el módulo
     * 
     * Configuración JWT:
     */
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>{
        return{
          /**
           * secret: Clave secreta para firmar y verificar tokens
           * 
           * CRÍTICO: Debe ser:
           * - Larga y aleatoria (mínimo 32 caracteres)
           * - Almacenada en variable de entorno (nunca hardcodeada)
           * - Diferente en desarrollo y producción
           * - Mantenida en secreto (nunca en repositorio)
           * 
           * Uso: Firmar tokens JWT para verificar autenticidad
           * 
           * Ejemplo de JWT_SECRET: "mi-super-secreto-seguro-de-64-caracteres-aleatorios-12345678"
           */
          secret: configService.get('JWT_SECRET'),
          
          /**
           * signOptions: Opciones de firma del token
           * 
           * expiresIn: '1h'
           * - Token expira en 1 hora
           * - Después de 1h, el token ya no es válido
           * - El usuario debe hacer login de nuevo
           * 
           * Valores posibles:
           * - '15m' (15 minutos)
           * - '1h' (1 hora)
           * - '7d' (7 días)
           * - '30d' (30 días)
           * 
           * Consideraciones:
           * - Tokens cortos (15m-1h): Más seguros pero usuario debe loguearse más seguido
           * - Tokens largos (7d-30d): Más cómodos pero más riesgo si se roban
           * 
           * Buena práctica:
           * - Access token corto (15m-1h) para autenticación
           * - Refresh token largo (7d-30d) para renovar access token
           * 
           * Caso de uso: Usuario hace login, obtiene token válido por 1 hora
           */
          signOptions:{
            expiresIn: '1h'
          }
        }
      }
    })
  ],
  
  /**
   * providers: Servicios del módulo
   * 
   * AuthService: Lógica de negocio (registro, login, hash de contraseñas)
   * JwtStrategy: Estrategia Passport para validar tokens JWT
   * ConfigService: Acceso a variables de entorno (exportado de ConfigModule)
   */
  providers: [AuthService, JwtStrategy, ConfigService],
  
  /**
   * exports: Hace que estos módulos/servicios estén disponibles para otros módulos
   * 
   * TypeOrmModule: Exporta Repository<User> para que otros módulos puedan usarlo
   * PassportModule: Exporta AuthGuard para proteger rutas en otros módulos
   * JwtModule: Exporta JwtService para generar tokens en otros módulos
   * JwtStrategy: Exporta la estrategia para que Passport la use globalmente
   * 
   * Caso de uso: Otros módulos pueden:
   * - Usar @UseGuards(AuthGuard()) en sus controladores
   * - Inyectar Repository<User> si necesitan datos de usuarios
   * - Generar tokens JWT con JwtService
   */
  exports: [TypeOrmModule, PassportModule, JwtModule, JwtStrategy]
})
export class AuthModule {}
