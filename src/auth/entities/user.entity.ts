// Importaciones de TypeORM para definir entidad y lifecycle hooks
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * @Entity: Entidad de TypeORM que representa la tabla "user" en PostgreSQL
 * 
 * Propósito: Almacenar usuarios del sistema con autenticación
 * Caso de uso: Sistema de login, registro y control de acceso basado en roles
 */
@Entity()
export class User {
    /**
     * @PrimaryGeneratedColumn('uuid')
     * 
     * Clave primaria con UUID autogenerado
     * Identifica de manera única cada usuario
     */
    @PrimaryGeneratedColumn('uuid')
    id:string;

    /**
     * @Column con unique constraint
     * 
     * type: 'text' - Tipo de dato texto
     * unique: true - Email único (no puede haber dos usuarios con el mismo email)
     * 
     * email: Correo electrónico del usuario
     * Se usa como identificador para login
     * 
     * TypeORM crea índice único automáticamente
     * Si intentas insertar email duplicado: error 23505 (violación de unique constraint)
     * 
     * Caso de uso: Identificar usuarios, login, recuperación de contraseña
     */
    @Column({
        type: 'text',
        unique: true
    })
    email:string;

    /**
     * fullName: Nombre completo del usuario
     * Campo obligatorio (no tiene nullable:true)
     * 
     * Ejemplo: "Juan Pérez García"
     */
    @Column('text')
    fullName:string;

    /**
     * password: Contraseña hasheada del usuario
     * 
     * El '?' hace que sea opcional en TypeScript
     * IMPORTANTE: Nunca se almacena en texto plano
     * Se hashea con bcrypt antes de guardar (ver AuthService.encryptPassword)
     * 
     * El DTO selecciona select: {password: true} solo cuando es necesario (login)
     * Por defecto, las consultas NO incluyen password por seguridad
     * 
     * Caso de uso: Autenticación, verificación de credenciales
     */
    @Column('text')
    password?:string;

    /**
     * @Column('bool', {default: true})
     * 
     * isActive: Indica si el usuario está activo
     * default: true - Los usuarios nuevos están activos por defecto
     * 
     * Uso:
     * - Desactivar usuarios sin eliminarlos de la BD
     * - Suspender cuentas temporalmente
     * - Soft delete (marcar como inactivo en lugar de borrar)
     * 
     * Caso de uso: Si isActive=false, el usuario no puede hacer login (ver JwtStrategy)
     */
    @Column('bool', {default: true})
    isActive: boolean;

    /**
     * @Column con array de strings
     * 
     * type: 'text' - Cada elemento del array es texto
     * array: true - PostgreSQL soporta arrays nativamente
     * default: ['teacher'] - Rol por defecto para nuevos usuarios
     * 
     * roles: Roles/permisos del usuario
     * Valores comunes: ['admin', 'teacher', 'student']
     * 
     * Uso: Control de acceso basado en roles (RBAC - Role-Based Access Control)
     * 
     * Ejemplo:
     * - Usuario admin: ['admin', 'teacher'] (puede hacer de todo)
     * - Usuario normal: ['teacher'] (solo puede enseñar)
     * 
     * Caso de uso: Proteger rutas según rol
     * @UseGuards(UserRoleGuard) verifica si el usuario tiene el rol requerido
     */
    @Column({
        type: 'text',
        array: true,
        default: ['teacher']
    })
    roles: string[];

    /**
     * @BeforeInsert y @BeforeUpdate: Lifecycle hooks de TypeORM
     * 
     * Se ejecutan automáticamente antes de INSERT y UPDATE
     * 
     * checkFieldsBeforeChanges():
     * Normaliza el email antes de guardar/actualizar
     * 
     * Transformaciones:
     * - toLowerCase(): Convierte a minúsculas
     *   "Juan@Example.COM" → "juan@example.com"
     * - trim(): Elimina espacios en blanco al inicio y final
     *   " juan@example.com " → "juan@example.com"
     * 
     * Beneficios:
     * - Evita duplicados por diferencias de mayúsculas/minúsculas
     * - Evita emails con espacios accidentales
     * - Consistencia en la base de datos
     * 
     * Caso de uso: Login case-insensitive
     * Usuario registrado: "Juan@Example.com"
     * Login con: "juan@example.com" → funciona correctamente
     */
    @BeforeInsert()
    @BeforeUpdate()
    checkFieldsBeforeChanges(){
        this.email = this.email.toLowerCase().trim();
    }

}
