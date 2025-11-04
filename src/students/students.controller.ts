// Importaciones de decoradores de NestJS para definir endpoints HTTP
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PaginationDto } from './dto/pagination.dto';

/**
 * @Controller: Decorador que marca esta clase como un controlador
 * 
 * 'students': Prefijo de ruta para todos los endpoints de este controlador
 * Todas las rutas comenzarán con /api/students (api viene del globalPrefix en main.ts)
 * 
 * Responsabilidad del controlador:
 * - Definir endpoints HTTP (rutas)
 * - Recibir peticiones (request)
 * - Validar datos de entrada (DTOs)
 * - Delegar lógica al servicio
 * - Devolver respuesta (response)
 * 
 * Arquitectura:
 * Cliente HTTP → Controller (rutas/validación) → Service (lógica) → Repository (BD) → PostgreSQL
 */
@Controller('students')
export class StudentsController {
  /**
   * Inyección de dependencias del servicio
   * private readonly: El servicio es privado e inmutable
   * 
   * NestJS automáticamente instancia StudentsService y lo inyecta aquí
   */
  constructor(private readonly studentsService: StudentsService) {}

  /**
   * @Post: Endpoint HTTP POST
   * 
   * Ruta: POST /api/students
   * Propósito: Crear un nuevo estudiante
   * 
   * @Body: Decorador que extrae el cuerpo de la petición HTTP
   * createStudentDto: Los datos del body se validan automáticamente contra CreateStudentDto
   * 
   * Si la validación falla, NestJS devuelve 400 Bad Request automáticamente
   * Si la validación pasa, se ejecuta this.studentsService.create()
   * 
   * Ejemplo de petición:
   * POST http://localhost:3000/api/students
   * Content-Type: application/json
   * 
   * {
   *   "name": "Juan Pérez",
   *   "age": 20,
   *   "email": "juan@example.com",
   *   "gender": "Male",
   *   "subjects": ["Math", "Science"]
   * }
   * 
   * Respuesta exitosa: 201 Created con el estudiante creado
   */
  @Post()
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  /**
   * @Get: Endpoint HTTP GET
   * 
   * Ruta: GET /api/students
   * Propósito: Listar todos los estudiantes con paginación
   * 
   * @Query: Decorador que extrae parámetros de query string
   * paginationDto: Se valida automáticamente contra PaginationDto
   * 
   * Ejemplo de petición:
   * GET http://localhost:3000/api/students?limit=10&offset=0
   * 
   * Query params:
   * - limit=10: Devolver máximo 10 estudiantes
   * - offset=0: Empezar desde el primer registro
   * 
   * Si no se envían limit y offset, serán undefined (el servicio maneja esto)
   * 
   * Respuesta: 200 OK con array de estudiantes
   */
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.studentsService.findAll(paginationDto);
  }

  /**
   * @Get(':term'): Endpoint GET con parámetro de ruta
   * 
   * Ruta: GET /api/students/:term
   * Propósito: Buscar un estudiante por ID, nombre o nickname
   * 
   * @Param('term'): Decorador que extrae el valor del parámetro :term de la URL
   * 
   * :term es un parámetro dinámico que puede ser:
   * - UUID: "550e8400-e29b-41d4-a716-446655440000"
   * - Nombre: "Juan Perez"
   * - Nickname: "juan_perez20"
   * 
   * Ejemplos de petición:
   * GET http://localhost:3000/api/students/550e8400-e29b-41d4-a716-446655440000
   * GET http://localhost:3000/api/students/Juan
   * GET http://localhost:3000/api/students/juan_perez20
   * 
   * Respuesta exitosa: 200 OK con el estudiante
   * Respuesta error: 404 Not Found si no existe
   */
  @Get(':term')
  findOne(@Param('term') term: string) {
    return this.studentsService.findOne(term);
  }

  /**
   * @Patch: Endpoint HTTP PATCH
   * 
   * Ruta: PATCH /api/students/:id
   * Propósito: Actualizar parcialmente un estudiante
   * 
   * PATCH vs PUT:
   * - PATCH: Actualización parcial (solo los campos enviados)
   * - PUT: Reemplazo completo (todos los campos)
   * 
   * @Param('id'): Extrae el UUID del estudiante de la URL
   * @Body: Extrae los datos a actualizar del cuerpo de la petición
   * 
   * updateStudentDto: Validado contra UpdateStudentDto (todos los campos opcionales)
   * 
   * Ejemplo de petición:
   * PATCH http://localhost:3000/api/students/550e8400-e29b-41d4-a716-446655440000
   * Content-Type: application/json
   * 
   * {
   *   "email": "nuevoemail@example.com",
   *   "age": 21
   * }
   * 
   * Solo actualiza email y age, los demás campos quedan igual
   * 
   * Respuesta: 200 OK con el estudiante actualizado
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  /**
   * @Delete: Endpoint HTTP DELETE
   * 
   * Ruta: DELETE /api/students/:id
   * Propósito: Eliminar un estudiante
   * 
   * @Param('id'): Extrae el UUID del estudiante de la URL
   * 
   * Ejemplo de petición:
   * DELETE http://localhost:3000/api/students/550e8400-e29b-41d4-a716-446655440000
   * 
   * Efecto:
   * - Elimina el estudiante de la BD
   * - Sus calificaciones también se eliminan (onDelete: CASCADE)
   * 
   * Respuesta exitosa: 200 OK
   * Respuesta error: 404 Not Found si no existe
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
