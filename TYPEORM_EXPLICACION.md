# 📚 Guía Completa de TypeORM en este Proyecto

## 🎯 ¿Qué es TypeORM?

**TypeORM** es un ORM (Object-Relational Mapping) que permite trabajar con bases de datos relacionales usando objetos de TypeScript/JavaScript en lugar de escribir SQL directamente.

### Ventajas principales:
- ✅ Escribes código TypeScript en lugar de SQL
- ✅ Type-safety (detección de errores en tiempo de compilación)
- ✅ Migraciones automáticas (en desarrollo)
- ✅ Relaciones entre tablas fáciles de manejar
- ✅ Soporte para múltiples bases de datos (Postgres, MySQL, SQLite, etc.)

---

## 🔧 Configuración Inicial

### En `app.module.ts`:

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',              // Tipo de base de datos
  host: process.env.DB_HOST,     // localhost o servidor
  port: +process.env.DB_PORT,    // 5432 para Postgres
  database: process.env.DB_NAME, // Nombre de la BD
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  autoLoadEntities: true,        // Carga automática de entidades
  synchronize: true              // ⚠️ SOLO EN DESARROLLO
})
```

**⚠️ IMPORTANTE**: `synchronize: true` sincroniza automáticamente la BD con tus entidades pero puede **BORRAR DATOS** en producción. En producción usar **migraciones**.

---

## 📋 Decoradores de Entidades

### `@Entity()`
Marca una clase como tabla en la base de datos.

```typescript
@Entity()
export class Student {
  // Propiedades = Columnas
}
```
Crea tabla `student` en PostgreSQL.

---

### `@PrimaryGeneratedColumn()`
Define la clave primaria autogenerada.

```typescript
@PrimaryGeneratedColumn('uuid')
id: string;
```
- **'uuid'**: Genera IDs únicos universales (ej: `550e8400-e29b-41d4-a716-446655440000`)
- **'increment'**: Genera números secuenciales (1, 2, 3...)

**Cuándo usar UUID:**
- Sistemas distribuidos
- Más seguro (no predecible)
- Fusión de bases de datos

---

### `@Column()`
Define una columna en la tabla.

#### Sintaxis simple:
```typescript
@Column('text')
name: string;
```

#### Sintaxis con opciones:
```typescript
@Column({
  type: 'int',           // Tipo de dato en PostgreSQL
  nullable: true,        // Permite NULL
  unique: true,          // Valor único en toda la tabla
  default: 'teacher',    // Valor por defecto
  array: true            // Columna de tipo array (solo Postgres)
})
```

**Tipos comunes:**
- `'text'` - Texto sin límite
- `'varchar'` - Texto con límite
- `'int'` - Número entero
- `'float'` - Número decimal
- `'bool'` - Booleano
- `'timestamp'` - Fecha y hora
- `'uuid'` - UUID

---

## 🔗 Relaciones entre Tablas

### `@OneToMany` - Uno a Muchos

**Caso:** Un estudiante tiene MUCHAS calificaciones.

```typescript
// En Student entity
@OneToMany(
  () => Grade,                    // Entidad relacionada
  (grade) => grade.student,       // Propiedad inversa
  { 
    cascade: true,                // Operaciones en cascada
    eager: true                   // Carga automática
  }
)
grade?: Grade[]
```

**Opciones importantes:**

#### `cascade: true`
Las operaciones se propagan:
- Guardar Student → guarda sus Grades automáticamente
- Eliminar Student → elimina sus Grades automáticamente

```typescript
// Sin cascade
const student = studentRepository.create({ name: "Juan" });
student.grade = [new Grade()];
await studentRepository.save(student);  // ❌ No guarda grades
await gradeRepository.save(student.grade); // Necesitas guardarlas

// Con cascade: true
await studentRepository.save(student);  // ✅ Guarda student Y grades
```

#### `eager: true`
Carga automática de relaciones:

```typescript
// Con eager: true
const student = await studentRepository.find();
console.log(student.grade); // ✅ Ya tiene las grades cargadas

// Sin eager (lazy loading)
const student = await studentRepository.find();
console.log(student.grade); // ❌ undefined
const student = await studentRepository.find({ relations: ['grade'] });
console.log(student.grade); // ✅ Ahora sí tiene grades
```

---

### `@ManyToOne` - Muchos a Uno

**Caso:** MUCHAS calificaciones pertenecen a un estudiante.

```typescript
// En Grade entity
@ManyToOne(
  () => Student,
  (student) => student.grade,
  { onDelete: 'CASCADE' }
)
student?: Student;
```

#### `onDelete: 'CASCADE'`
Si se elimina el Student, sus Grades se eliminan automáticamente.

```typescript
// SQL equivalente:
ALTER TABLE grade 
ADD CONSTRAINT FK_student 
FOREIGN KEY (studentId) REFERENCES student(id) 
ON DELETE CASCADE;
```

**Opciones de onDelete:**
- `'CASCADE'` - Elimina registros relacionados
- `'SET NULL'` - Pone NULL en la FK
- `'RESTRICT'` - Impide eliminar si hay relaciones
- `'NO ACTION'` - No hace nada

---

## 🔄 Lifecycle Hooks

### `@BeforeInsert()`
Se ejecuta ANTES de insertar un nuevo registro.

```typescript
@BeforeInsert()
checkNicknameInsert() {
  if (!this.nickname) {
    this.nickname = this.name;
  }
  this.nickname = this.nickname.toLowerCase();
}
```

**Caso de uso:** Transformar o generar datos antes de guardar.

---

### `@BeforeUpdate()`
Se ejecuta ANTES de actualizar un registro.

```typescript
@BeforeUpdate()
checkNicknameUpdate() {
  this.nickname = this.nickname.toLowerCase();
}
```

**Caso de uso:** Mantener consistencia al actualizar.

---

## 🗄️ Repository Pattern

El **Repository** es el patrón de TypeORM para operaciones CRUD.

### Inyectar Repository:

```typescript
constructor(
  @InjectRepository(Student)
  private readonly studentRepository: Repository<Student>
) {}
```

---

### Métodos Principales del Repository:

#### 1. `create()` - Crear instancia (NO guarda)
```typescript
const student = this.studentRepository.create({
  name: "Juan",
  age: 20
});
// Objeto creado en memoria, NO en base de datos
```

#### 2. `save()` - Guardar en BD
```typescript
await this.studentRepository.save(student);
// INSERT INTO student (name, age) VALUES ('Juan', 20);
```

#### 3. `find()` - Buscar múltiples
```typescript
const students = await this.studentRepository.find({
  take: 10,        // LIMIT 10
  skip: 20,        // OFFSET 20
  where: { age: 20 },
  relations: ['grade']  // LEFT JOIN grade
});
// SELECT * FROM student WHERE age = 20 LIMIT 10 OFFSET 20;
```

#### 4. `findOne()` - Buscar uno
```typescript
const student = await this.studentRepository.findOne({
  where: { email: 'test@test.com' },
  select: { email: true, password: true }  // Solo estos campos
});
// SELECT email, password FROM student WHERE email = 'test@test.com';
```

#### 5. `findOneBy()` - Buscar por condición simple
```typescript
const student = await this.studentRepository.findOneBy({ id: '123' });
// SELECT * FROM student WHERE id = '123';
```

#### 6. `preload()` - Cargar y aplicar cambios
```typescript
const student = await this.studentRepository.preload({
  id: '123',
  name: 'Nuevo nombre'
});
// Carga el estudiante con id=123
// Aplica los cambios (name)
// NO guarda automáticamente
```

#### 7. `remove()` - Eliminar entidad
```typescript
const student = await this.studentRepository.findOneBy({ id: '123' });
await this.studentRepository.remove(student);
// DELETE FROM student WHERE id = '123';
```

#### 8. `delete()` - Eliminar por condición
```typescript
await this.studentRepository.delete({ id: '123' });
// DELETE FROM student WHERE id = '123';
```

**Diferencia remove() vs delete():**
- `remove()`: Recibe entidad, dispara hooks
- `delete()`: Recibe condición, más rápido, NO dispara hooks

---

## 🔍 Query Builder

Para consultas más complejas que `find()`.

### Crear Query Builder:
```typescript
const queryBuilder = this.studentRepository.createQueryBuilder('student');
```

### WHERE con parámetros:
```typescript
const student = await queryBuilder
  .where('UPPER(name) = :name OR nickname = :nickname', {
    name: term.toUpperCase(),
    nickname: term.toLowerCase()
  })
  .getOne();

// SQL: SELECT * FROM student 
// WHERE UPPER(name) = 'JUAN' OR nickname = 'juan_perez'
```

**⚠️ Siempre usar parámetros (`:name`) para prevenir SQL injection!**

### LEFT JOIN:
```typescript
await queryBuilder
  .leftJoinAndSelect('student.grade', 'studentGrades')
  .getOne();

// SQL: SELECT student.*, grade.* 
// FROM student 
// LEFT JOIN grade ON grade.studentId = student.id
```

### DELETE con Query Builder:
```typescript
await queryBuilder
  .delete()
  .where({})  // Sin WHERE = elimina todo
  .execute();

// SQL: DELETE FROM student;
```

---

## 🔄 Transacciones

Las transacciones garantizan que **TODAS las operaciones se completen o NINGUNA**.

### ¿Cuándo usar transacciones?

Cuando necesitas que múltiples operaciones sean **atómicas**:
- Eliminar calificaciones viejas + Insertar nuevas
- Transferir dinero entre cuentas
- Actualizar inventario y crear orden

### Implementación:

```typescript
// 1. Crear QueryRunner
const queryRunner = this.dataSource.createQueryRunner();

// 2. Conectar
await queryRunner.connect();

// 3. Iniciar transacción
await queryRunner.startTransaction();

try {
  // 4. Operaciones
  await queryRunner.manager.delete(Grade, { student: { id } });
  await queryRunner.manager.save(student);
  
  // 5. Confirmar (COMMIT)
  await queryRunner.commitTransaction();
} catch (error) {
  // 6. Revertir (ROLLBACK) si hay error
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  // 7. Liberar conexión
  await queryRunner.release();
}
```

**SQL generado:**
```sql
BEGIN;
DELETE FROM grade WHERE studentId = '123';
UPDATE student SET name = '...' WHERE id = '123';
COMMIT;  -- Si todo OK
-- O
ROLLBACK; -- Si hubo error
```

---

## 📊 SQL Generado (Ejemplos)

### Crear tabla (synchronize: true):
```sql
CREATE TABLE student (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER,
  email TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  gender TEXT NOT NULL,
  subjects TEXT[] NOT NULL
);

CREATE TABLE grade (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  grade TEXT NOT NULL,  -- ⚠️ Debería ser DECIMAL
  studentId UUID,
  FOREIGN KEY (studentId) REFERENCES student(id) ON DELETE CASCADE
);
```

### Insertar con relaciones (cascade):
```sql
BEGIN;
INSERT INTO student (id, name, email, ...) 
VALUES ('uuid1', 'Juan', 'juan@test.com', ...);

INSERT INTO grade (id, subject, grade, studentId) 
VALUES ('uuid2', 'Math', '4.5', 'uuid1');

INSERT INTO grade (id, subject, grade, studentId) 
VALUES ('uuid3', 'Science', '4.0', 'uuid1');
COMMIT;
```

### Buscar con relaciones (eager: true):
```sql
SELECT student.*, grade.* 
FROM student 
LEFT JOIN grade ON grade.studentId = student.id 
WHERE student.id = 'uuid1';
```

---

## 🚀 Best Practices

### ✅ DO:
- Usar variables de entorno para credenciales de BD
- Usar `synchronize: false` en producción
- Usar migraciones en producción
- Usar transacciones para operaciones múltiples
- Usar parámetros en queries (`:param`)
- Validar datos con DTOs antes de guardar
- Usar UUIDs para claves primarias en sistemas distribuidos

### ❌ DON'T:
- NO hardcodear contraseñas de BD
- NO usar `synchronize: true` en producción
- NO confiar en datos del usuario sin validar
- NO hacer queries sin paginación
- NO olvidar indices en columnas de búsqueda frecuente
- NO usar `delete({})` sin WHERE en producción

---

## 🐛 Errores Comunes

### Error: `23505` - Violación de UNIQUE constraint
```typescript
// Error: Email ya existe
if (error.code === '23505') {
  throw new InternalServerErrorException(error.detail);
}
```

### Error: Relaciones no cargadas
```typescript
// ❌ Sin eager, relaciones son undefined
const student = await this.studentRepository.find();
console.log(student.grade); // undefined

// ✅ Opciones:
// 1. eager: true en la entidad
// 2. relations en find()
const student = await this.studentRepository.find({ 
  relations: ['grade'] 
});
```

### Error: QueryRunner no liberado
```typescript
// ❌ Malo - puede causar memory leaks
const qr = this.dataSource.createQueryRunner();
await qr.connect();
await qr.startTransaction();
// ... si hay error aquí, nunca se libera

// ✅ Bueno - siempre libera
try {
  // ...
} finally {
  await queryRunner.release();
}
```

---

## 📚 Recursos Adicionales

- [TypeORM Documentation](https://typeorm.io/)
- [NestJS TypeORM Integration](https://docs.nestjs.com/techniques/database)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)

---

## 🎓 Resumen de Conceptos Clave

| Concepto | Qué hace | Cuándo usar |
|----------|----------|-------------|
| `@Entity()` | Crea tabla en BD | Definir modelos de datos |
| `@Column()` | Crea columna | Cada propiedad de la entidad |
| `@PrimaryGeneratedColumn()` | Clave primaria auto | ID único de cada registro |
| `@OneToMany()` | Relación 1:N | Un padre, muchos hijos |
| `@ManyToOne()` | Relación N:1 | Muchos hijos, un padre |
| `cascade: true` | Operaciones en cascada | Guardar/eliminar relaciones juntas |
| `eager: true` | Carga automática | Siempre necesitas la relación |
| `Repository` | CRUD operations | Todas las operaciones de BD |
| `QueryBuilder` | Queries complejas | WHERE, JOIN, subqueries |
| `QueryRunner` | Transacciones | Operaciones atómicas múltiples |
| `synchronize` | Sincronizar esquema | Solo desarrollo |

---

**¡Proyecto completamente comentado! 🎉**

Todos los archivos ahora tienen comentarios explicando:
- Qué hace cada decorador de TypeORM
- Cómo funcionan las relaciones
- Cuándo y por qué usar cada método
- Ejemplos de SQL generado
- Casos de uso prácticos
