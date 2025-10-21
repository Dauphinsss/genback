import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

{ /*
  IMPORTANTE: Antes de ejecutar este seed, es necesario tener al menos un usuario en la base de datos.
  
  El siguiente archivo "seed" se puede ejecutar con el comando:
    > npx prisma db seed
    ó
    > npx tsx prisma/seed.ts
*/ }

async function main() {
  {/* Descomentar todo el bloque en caso de necesitar borrar conflictos en la BD */}
  
  {/*
  await prisma.userPrivilege.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.content.deleteMany();
  await prisma.lessonTopic.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.courseStudent.deleteMany();
  await prisma.course.deleteMany();
  await prisma.courseBase.deleteMany();
  await prisma.privilege.deleteMany();
  await prisma.user.deleteMany();
  */}

  await prisma.privilege.createMany({
    data: [
      {
        id: 1,
        name: "manage_users",
        description: "Permite gestionar usuarios del sistema",
        category: "admin",
        createdAt: new Date("2025-10-15T14:42:17.000Z"),
        updatedAt: new Date("2025-10-15T14:42:17.000Z")
      },
      {
        id: 2,
        name: "manage_privileges",
        description: "Permite gestionar privilegios del sistema",
        category: "admin",
        createdAt: new Date("2025-10-15T14:42:17.000Z"),
        updatedAt: new Date("2025-10-15T14:42:17.000Z")
      },
      {
        id: 3,
        name: "manage_courses",
        description: "Permite gestionar cursos del sistema",
        category: "admin",
        createdAt: new Date("2025-10-15T14:42:17.000Z"),
        updatedAt: new Date("2025-10-15T14:42:17.000Z")
      },
      {
        id: 4,
        name: "create_topics",
        description: "Permite crear tópicos en el sistema",
        category: "teacher",
        createdAt: new Date("2025-10-15T14:42:17.000Z"),
        updatedAt: new Date("2025-10-15T14:42:17.000Z")
      },
      {
        id: 5,
        name: "view_base_course",
        description: "Permite ver el curso base del sistema",
        category: "admin",
        createdAt: new Date("2025-10-15T14:42:17.000Z"),
        updatedAt: new Date("2025-10-15T14:42:17.000Z")
      },
      {
        id: 6,
        name: "edit_base_course",
        description: "Permite modificar el curso base del sistema",
        category: "admin",
        createdAt: new Date("2025-10-15T14:42:17.000Z"),
        updatedAt: new Date("2025-10-15T14:42:17.000Z")
      }
    ]
  });

  { /* 
    Es recomendable dejar este bloque vacío para no tener problemas con cuentas de google que no tenemos acceso personal. 
    Aunque en caso de requerir un usuario administrador, es posible crearlo aquí, pero requerirá otra lógica de inicio de sesión.
  */ }
  await prisma.user.createMany({
    data: []
  });

  await prisma.userPrivilege.createMany({
    data: [
      { id: 1, userId: 1, privilegeId: 1, assignedAt: new Date("2025-10-15T19:40:04.000Z") },
      { id: 2, userId: 1, privilegeId: 2, assignedAt: new Date("2025-10-15T19:40:04.000Z") },
      { id: 3, userId: 1, privilegeId: 3, assignedAt: new Date("2025-10-15T19:40:04.000Z") },
      { id: 4, userId: 1, privilegeId: 4, assignedAt: new Date("2025-10-15T19:40:04.000Z") },
      { id: 5, userId: 1, privilegeId: 5, assignedAt: new Date("2025-10-15T19:40:04.000Z") },
      { id: 6, userId: 1, privilegeId: 6, assignedAt: new Date("2025-10-15T19:40:04.000Z") }
    ]
  });

  { /* Tablas vacías para futuros seeds, modificar este archivo con datos indispensables y reales */ }
  await prisma.resource.createMany({ data: [] });
  await prisma.content.createMany({ data: [] });
  await prisma.lesson.createMany({ data: [] });
  await prisma.unit.createMany({ data: [] });
  await prisma.topic.createMany({ data: [] });
  await prisma.courseStudent.createMany({ data: [] });
  await prisma.lessonTopic.createMany({ data: [] });
  await prisma.course.createMany({ data: [] });
  await prisma.courseBase.createMany({ data: [] });

  console.log("Seed ejecutado correctamente (todas las tablas incluidas, aunque estén vacías).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
