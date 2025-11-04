// Importaciones de NestJS para crear controladores y guards
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Headers, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { RawHeaders } from './decorators/raw-headers.decorator';
import { UserRoleGuard } from './guards/user-role/user-role.guard';

/**
 * @Controller('auth'): Controlador de autenticación
 * 
 * Prefijo de ruta: /api/auth
 * Maneja todas las rutas relacionadas con autenticación y autorización
 * 
 * Endpoints:
 * - POST /api/auth/register - Registrar nuevo usuario
 * - POST /api/auth/login - Iniciar sesión
 * - GET /api/auth/private - Ruta protegida de ejemplo
 */
@Controller('auth')
export class AuthController {
  /**
   * Inyección del servicio de autenticación
   * Delega toda la lógica de negocio al servicio
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * @Post('register'): Endpoint de registro
   * 
   * Ruta: POST /api/auth/register
   * Propósito: Crear una nueva cuenta de usuario
   * 
   * @Body: Extrae datos del cuerpo de la petición
   * createUserDto: Validado automáticamente contra CreateUserDto
   * 
   * Proceso:
   * 1. ValidationPipe valida el DTO
   * 2. Si es válido, llama a authService.create()
   * 3. AuthService hashea password, guarda usuario, genera token
   * 4. Retorna usuario + token JWT
   * 
   * Ejemplo de request:
   * POST http://localhost:3000/api/auth/register
   * Content-Type: application/json
   * 
   * {
   *   "email": "nuevo@example.com",
   *   "fullName": "Usuario Nuevo",
   *   "password": "password123"
   * }
   * 
   * Respuesta exitosa (201 Created):
   * {
   *   "id": "uuid",
   *   "email": "nuevo@example.com",
   *   "fullName": "Usuario Nuevo",
   *   "isActive": true,
   *   "roles": ["teacher"],
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   * 
   * Errores posibles:
   * - 400 Bad Request: Datos inválidos (email mal formato, password corta)
   * - 500 Internal Server Error: Email ya existe (unique constraint)
   */
  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  /**
   * @Post('login'): Endpoint de autenticación
   * 
   * Ruta: POST /api/auth/login
   * Propósito: Iniciar sesión con credenciales
   * 
   * @Body: Extrae email y password del request body
   * login: LoginDto validado automáticamente
   * 
   * Proceso:
   * 1. Valida formato de email y password
   * 2. AuthService busca usuario por email
   * 3. Compara password con bcrypt
   * 4. Si es correcto, genera token JWT
   * 5. Retorna usuario + token
   * 
   * Ejemplo de request:
   * POST http://localhost:3000/api/auth/login
   * Content-Type: application/json
   * 
   * {
   *   "email": "usuario@example.com",
   *   "password": "password123"
   * }
   * 
   * Respuesta exitosa (200 OK):
   * {
   *   "id": "uuid",
   *   "email": "usuario@example.com",
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   * 
   * Errores posibles:
   * - 400 Bad Request: Email o password con formato inválido
   * - 404 Not Found: Usuario no existe
   * - 401 Unauthorized: Password incorrecto
   */
  @Post('login')
  login(@Body() login: LoginDto){
    return this.authService.login(login);
  }

  /**
   * @Get('private'): Endpoint protegido de ejemplo
   * 
   * Ruta: GET /api/auth/private
   * Propósito: Demostrar protección de rutas con guards
   * 
   * @UseGuards(AuthGuard(), UserRoleGuard):
   * Aplica múltiples guards en orden
   * 
   * 1. AuthGuard():
   *    - Verifica que el request tenga token JWT válido
   *    - Extrae token del header Authorization
   *    - Valida firma y expiración
   *    - Llama a JwtStrategy.validate()
   *    - Adjunta usuario a request.user
   *    - Si falla, lanza 401 Unauthorized
   * 
   * 2. UserRoleGuard:
   *    - Lee metadatos de @SetMetadata
   *    - Verifica que el usuario tenga roles requeridos
   *    - Si no tiene rol, lanza 403 Forbidden
   * 
   * @SetMetadata('roles', ['admin', 'teacher']):
   * Define qué roles pueden acceder a esta ruta
   * - Solo usuarios con rol 'admin' o 'teacher'
   * - UserRoleGuard lee estos metadatos
   * 
   * Decoradores comentados (@GetUser, @RawHeaders):
   * Ejemplos de cómo extraer datos del request
   * 
   * //@GetUser() user: User
   * Extrae usuario del request.user (adjuntado por AuthGuard)
   * 
   * //@RawHeaders() headers: Headers
   * Extrae headers HTTP raw del request
   * 
   * Ejemplo de request:
   * GET http://localhost:3000/api/auth/private
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * 
   * Respuesta exitosa (200 OK):
   * {
   *   "ok": true,
   *   "message": "logged in"
   * }
   * 
   * Errores posibles:
   * - 401 Unauthorized: Sin token, token inválido, token expirado
   * - 403 Forbidden: Usuario no tiene rol 'admin' o 'teacher'
   * 
   * Flujo completo:
   * 1. Cliente envía request con header Authorization
   * 2. AuthGuard() extrae y verifica token
   * 3. JwtStrategy.validate() busca usuario en BD
   * 4. Usuario se adjunta a request.user
   * 5. UserRoleGuard verifica roles del usuario
   * 6. Si todo OK, ejecuta el método del controlador
   * 7. Retorna respuesta al cliente
   * 
   * Caso de uso:
   * - Rutas que solo usuarios autenticados pueden acceder
   * - Rutas con control de acceso basado en roles
   * - Panel de administración
   * - Recursos protegidos
   */
  @Get('private')
  
  @UseGuards(AuthGuard(), UserRoleGuard)
  @SetMetadata('roles', ['admin', 'teacher'])
  testPrivate(
    //@GetUser() user: User
    //@RawHeaders() headers: Headers
    
  ){
    //console.log("🚀 ~ :29 ~ AuthController ~ testPrivate ~ user:", user)
    return {
      ok: true,
      message: 'logged in'
    }
  }
}
