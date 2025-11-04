// Importaciones de NestJS, TypeORM, bcrypt y JWT
import { Injectable, InternalServerErrorException, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { Jwt } from './interfaces/jwt.interface';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

/**
 * @Injectable: Servicio de autenticación
 * 
 * Responsabilidades:
 * - Registrar nuevos usuarios
 * - Autenticar usuarios (login)
 * - Generar tokens JWT
 * - Hashear contraseñas con bcrypt
 */
@Injectable()
export class AuthService {
  /**
   * Logger para registrar eventos y errores
   * Útil para debugging y auditoría de seguridad
   */
  private logger = new Logger('AuthService')

  /**
   * Constructor con inyección de dependencias
   * 
   * @InjectRepository(User): Inyecta Repository<User>
   * - Para operaciones CRUD en la tabla user
   * 
   * JwtService: Servicio de @nestjs/jwt
   * - Para generar (sign) y verificar (verify) tokens JWT
   * - Configurado en AuthModule con secret y expiresIn
   * 
   * Sin ConfigService porque no se usa en este servicio (pero está disponible)
   */
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ){}

  /**
   * Crea un nuevo usuario en el sistema
   * 
   * @param createUserDto - Datos del usuario (email, fullName, password)
   * @returns Usuario creado (sin password) + token JWT
   * 
   * Proceso:
   * 1. Desestructura password del resto de datos
   * 2. Crea instancia de User con password hasheada
   * 3. Guarda en base de datos
   * 4. Elimina password del objeto (seguridad)
   * 5. Genera token JWT
   * 6. Devuelve usuario + token
   * 
   * TypeORM operations:
   * - create(): Crea instancia sin guardar
   * - save(): INSERT en la tabla user
   * 
   * Bcrypt:
   * - encryptPassword(): Hashea la contraseña antes de guardar
   * - NUNCA se guarda password en texto plano
   * 
   * SQL generado:
   * INSERT INTO user (email, fullName, password, isActive, roles) 
   * VALUES ('email', 'name', '$2b$10$...', true, '{teacher}');
   * 
   * Caso de uso: POST /api/auth/register
   */
  async create(createUserDto: CreateUserDto) {
    const {password, ...userData }= createUserDto;
    try{
      // Crear usuario con password hasheada
      const user = this.userRepository.create({
        ...userData,
        password: this.encryptPassword(password)
      });
      
      // Guardar en base de datos
      await this.userRepository.save(user);
      
      // Eliminar password por seguridad (no enviar al cliente)
      delete user.password;
      
      // Devolver usuario y token JWT
      return {
      ...user,
      token: this.getJwtToken(
        {id: user.id, 
          email: user.email
        })
    };
    }catch(error){
      this.handleException(error);
    }
  }

  /**
   * Autentica un usuario (login)
   * 
   * @param loginDto - Credenciales (email, password)
   * @returns Usuario autenticado + token JWT
   * 
   * Proceso:
   * 1. Busca usuario por email con password incluido
   * 2. Verifica que el usuario exista
   * 3. Compara password enviado con hash en BD
   * 4. Si es correcto, genera token JWT
   * 5. Devuelve usuario + token
   * 
   * TypeORM operations:
   * 
   * findOne({ where: { email }, select: { email, password, id } }):
   * - where: { email } - WHERE email = 'email'
   * - select: { email, password, id } - Solo selecciona estos campos
   * 
   * ¿Por qué select explícito?
   * Por defecto, TypeORM NO incluye campos sensibles como password
   * Aquí necesitamos password para comparar con bcrypt
   * 
   * SQL generado:
   * SELECT id, email, password FROM user WHERE email = 'email@example.com';
   * 
   * Bcrypt compareSync:
   * - Compara password en texto plano con hash
   * - bcrypt.compareSync('password123', '$2b$10$...') → true/false
   * - No se puede "desencriptar" el hash, solo comparar
   * 
   * Excepciones:
   * - NotFoundException: Usuario no existe
   * - UnauthorizedException: Password incorrecto
   * 
   * Caso de uso: POST /api/auth/login
   */
  async login(loginDto: LoginDto){
    const {email, password} = loginDto;
    
    // Buscar usuario por email (incluir password para validación)
    const user = await this.userRepository.findOne({
      where: {email},
      select: {email: true, password: true, id:true}
    })

    // Verificar que el usuario existe
    if(!user) throw new NotFoundException(`User ${email} not found`)
    
    // Comparar password enviado con hash en BD
    if(!bcrypt.compareSync(password, user.password!))
      throw new UnauthorizedException(`Email or password incorrect`);

    // Eliminar password por seguridad
    delete user.password;
    
    // Devolver usuario y token JWT
    return {
      ...user,
      token: this.getJwtToken(
        {id: user.id, 
          email: user.email
        })
    };
  }   

  /**
   * Encripta una contraseña usando bcrypt
   * 
   * @param password - Contraseña en texto plano
   * @returns Hash de la contraseña
   * 
   * bcrypt.hashSync(password, saltRounds):
   * - password: Texto plano a hashear
   * - 10: Número de rondas de sal (rounds)
   * 
   * ¿Qué es salt rounds?
   * - Número de veces que se aplica el algoritmo de hash
   * - Más rounds = más seguro pero más lento
   * - 10 es un buen balance (recomendado)
   * 
   * Ejemplo:
   * Input: "password123"
   * Output: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
   * 
   * Características:
   * - Siempre genera hash diferente (gracias a la sal aleatoria)
   * - No se puede revertir (one-way hash)
   * - Mismo password genera hashes diferentes cada vez
   * 
   * Caso de uso: Guardar contraseñas de forma segura
   */
  encryptPassword(password){
    return bcrypt.hashSync(password, 10)
  }

  /**
   * Genera un token JWT firmado
   * 
   * @param payload - Datos a incluir en el token (id, email)
   * @returns Token JWT firmado como string
   * 
   * jwtService.sign(payload):
   * - Crea token JWT con el payload
   * - Firma el token con el secret configurado en AuthModule
   * - Aplica expiresIn configurado (1h)
   * 
   * Estructura JWT (3 partes separadas por .):
   * header.payload.signature
   * 
   * Ejemplo de token:
   * "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTYzNjQ4OTIwMCwiZXhwIjoxNjM2NDkyODAwfQ.signature"
   * 
   * Payload contiene:
   * - id: UUID del usuario
   * - email: Email del usuario
   * - iat: Timestamp de emisión (issued at)
   * - exp: Timestamp de expiración (expires)
   * 
   * Uso del token:
   * El cliente debe enviar este token en el header:
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * 
   * Caso de uso: Autenticación stateless (sin sesiones en servidor)
   */
  private getJwtToken(payload: Jwt){
    const token = this.jwtService.sign(payload);
    return token;
  }
  
  /**
   * Manejo centralizado de errores
   * 
   * error.code === '23505':
   * Código PostgreSQL para violación de UNIQUE constraint
   * Ejemplo: Email ya existe en la BD
   * 
   * error.detail: Mensaje específico de PostgreSQL
   * "Key (email)=(test@test.com) already exists."
   * 
   * Caso de uso: Informar al usuario que el email ya está registrado
   */
  private handleException(error){
      this.logger.error(error);
      if(error.code === '23505')
          throw new InternalServerErrorException(error.detail)
    }
}
