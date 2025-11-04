// Importaciones de NestJS para crear decoradores de metadatos
import { SetMetadata } from '@nestjs/common';

/**
 * @RoleProtected: Decorador personalizado para marcar rutas con roles requeridos
 * 
 * ¿Qué hace este decorador?
 * Adjunta metadatos a un endpoint indicando qué roles pueden acceder
 * 
 * SetMetadata(key, value):
 * - Función de NestJS para adjuntar metadatos a métodos/clases
 * - key: 'role-protected' (identificador único)
 * - value: Array de roles permitidos
 * 
 * ...args: string[]:
 * Spread operator que permite pasar múltiples roles como argumentos
 * 
 * Uso en controlador:
 * @Get('admin-only')
 * @UseGuards(AuthGuard(), UserRoleGuard)
 * @RoleProtected('admin', 'super-admin')
 * adminEndpoint() {
 *   return 'Solo admins pueden ver esto';
 * }
 * 
 * Flujo completo:
 * 1. @RoleProtected('admin') adjunta metadatos al método
 * 2. UserRoleGuard lee los metadatos con Reflector
 * 3. UserRoleGuard verifica si el usuario tiene el rol requerido
 * 4. Si sí, permite acceso; si no, lanza ForbiddenException
 * 
 * Metadatos adjuntados:
 * { 'role-protected': ['admin', 'super-admin'] }
 * 
 * Casos de uso:
 * - Rutas solo para administradores
 * - Rutas solo para profesores
 * - Rutas con múltiples roles permitidos
 * 
 * Ejemplos:
 * @RoleProtected('admin')               // Solo admins
 * @RoleProtected('admin', 'teacher')    // Admins o profesores
 * @RoleProtected('super-admin')         // Solo super admins
 */
export const RoleProtected = (...args: string[]) => SetMetadata('role-protected', args);

/**
 * Nota sobre el uso con guards:
 * 
 * Este decorador debe usarse junto con UserRoleGuard:
 * 
 * @Get('protected-route')
 * @UseGuards(AuthGuard(), UserRoleGuard)  // Ambos guards necesarios
 * @RoleProtected('admin')                  // Metadata con roles
 * protectedRoute() {
 *   return 'Protegido';
 * }
 * 
 * AuthGuard():
 * - Verifica que el usuario esté autenticado (token válido)
 * - Adjunta usuario a request.user
 * 
 * UserRoleGuard:
 * - Lee metadatos de @RoleProtected
 * - Verifica que request.user.roles incluya algún rol requerido
 * - Permite o deniega acceso
 * 
 * Sin @RoleProtected:
 * UserRoleGuard no encuentra metadatos y permite acceso a todos
 * (o puede configurarse para denegar por defecto)
 */

/**
 * Alternativa con SetMetadata directo:
 * 
 * En lugar de usar @RoleProtected, podrías hacer:
 * 
 * @Get('admin')
 * @SetMetadata('role-protected', ['admin'])
 * adminRoute() { ... }
 * 
 * Pero @RoleProtected es más limpio y legible:
 * 
 * @Get('admin')
 * @RoleProtected('admin')
 * adminRoute() { ... }
 */
