// Importaciones de NestJS para crear guards personalizados
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

/**
 * @Injectable: Marca como proveedor inyectable
 * 
 * UserRoleGuard: Guard personalizado para control de acceso basado en roles (RBAC)
 * 
 * ¿Qué es un Guard?
 * - Middleware que decide si un request puede continuar o ser rechazado
 * - Implementa la interface CanActivate
 * - Retorna true (permitir) o false (denegar)
 * 
 * CanActivate:
 * Interface de NestJS con método canActivate()
 * Determina si la petición puede acceder a la ruta
 * 
 * Flujo de ejecución:
 * Cliente → Request → AuthGuard (verifica token) → UserRoleGuard (verifica roles) → Controlador
 * 
 * Uso en controlador:
 * @Get('admin-panel')
 * @UseGuards(AuthGuard(), UserRoleGuard)
 * @SetMetadata('roles', ['admin'])
 * adminPanel() {
 *   return 'Panel de administrador';
 * }
 */
@Injectable()
export class UserRoleGuard implements CanActivate {

  /**
   * Reflector: Servicio de NestJS para leer metadatos
   * 
   * ¿Qué son metadatos?
   * Información adjunta a métodos/clases con decoradores como @SetMetadata
   * 
   * Reflector permite leer esos metadatos en guards, interceptors, etc.
   * 
   * Inyección por constructor:
   * NestJS inyecta automáticamente el Reflector
   */
  constructor(private readonly reflector: Reflector){}
  
  /**
   * canActivate: Método que decide si permitir el acceso
   * 
   * @param context - ExecutionContext con info del request
   * @returns boolean | Promise<boolean> | Observable<boolean>
   * 
   * Return values:
   * - true: Permite acceso, continúa al controlador
   * - false: Deniega acceso, lanza ForbiddenException
   * 
   * ExecutionContext:
   * Wrapper que contiene info sobre el request actual
   * Permite acceso a request HTTP, WebSocket, RPC, etc.
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    
    /**
     * reflector.get('roles', context.getHandler()):
     * Lee metadatos con key 'roles' del método del controlador
     * 
     * 'roles': Key de los metadatos (debe coincidir con @SetMetadata('roles', ...))
     * context.getHandler(): Referencia al método del controlador
     * 
     * Ejemplo:
     * Si el controlador tiene:
     * @SetMetadata('roles', ['admin', 'teacher'])
     * 
     * Entonces validRoles será: ['admin', 'teacher']
     * 
     * Si no hay @SetMetadata('roles', ...):
     * validRoles será: undefined
     */
    const validRoles: string [] = this.reflector.get('roles', context.getHandler())
    
    // Debug: Imprime roles requeridos en consola
    console.log("🚀 ~ :13 ~ UserRoleGuard ~ canActivate ~ validRoles:", validRoles)
    
    /**
     * IMPLEMENTACIÓN INCOMPLETA:
     * 
     * Actualmente siempre retorna true (permite todo)
     * 
     * Implementación correcta debería ser:
     * 
     * // Si no hay roles especificados, permitir acceso
     * if (!validRoles || validRoles.length === 0) return true;
     * 
     * // Obtener usuario del request (adjuntado por AuthGuard)
     * const request = context.switchToHttp().getRequest();
     * const user = request.user;
     * 
     * // Si no hay usuario, denegar (aunque AuthGuard debería prevenir esto)
     * if (!user) return false;
     * 
     * // Verificar si el usuario tiene alguno de los roles requeridos
     * const hasRole = validRoles.some(role => user.roles.includes(role));
     * 
     * // Si no tiene el rol, lanzar ForbiddenException
     * if (!hasRole) {
     *   throw new ForbiddenException('User does not have required role');
     * }
     * 
     * // Usuario tiene el rol, permitir acceso
     * return true;
     * 
     * Ejemplo:
     * validRoles: ['admin', 'teacher']
     * user.roles: ['teacher', 'student']
     * hasRole: true (tiene 'teacher')
     * Resultado: permite acceso
     * 
     * validRoles: ['admin']
     * user.roles: ['teacher']
     * hasRole: false (no tiene 'admin')
     * Resultado: lanza ForbiddenException
     */
    return true;
  }
}

/**
 * Ejemplo de uso completo:
 * 
 * @Controller('admin')
 * export class AdminController {
 *   
 *   @Get('dashboard')
 *   @UseGuards(AuthGuard(), UserRoleGuard)
 *   @SetMetadata('roles', ['admin'])
 *   getDashboard(@GetUser() user: User) {
 *     return {
 *       message: 'Panel de administrador',
 *       user: user
 *     };
 *   }
 *   
 *   @Get('users')
 *   @UseGuards(AuthGuard(), UserRoleGuard)
 *   @SetMetadata('roles', ['admin', 'super-admin'])
 *   getUsers() {
 *     return 'Lista de usuarios (solo admin o super-admin)';
 *   }
 * }
 * 
 * Casos de uso:
 * - Restringir endpoints a administradores
 * - Diferentes niveles de acceso (admin, moderador, usuario)
 * - Rutas que requieren múltiples roles
 * - Control de acceso fino basado en permisos
 */
