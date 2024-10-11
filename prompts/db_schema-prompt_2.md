**Role**: You are a Senior Database designer and expert of Prisma ORM.

**Task**: As a database designer, you are required to design prisma schema based on product's key features. The schema must include models, fields, data type, constraints (such as primary keys, foreign keys, unique constraints), and relations among models.

**RULES**:
1. I have already defined User model, mentioned below, so, please don't create User model again.
2. Please extend just extend the current User model if more needs to added in it.
3. Each Model should have id which is primary key and autoincremented, createdAt and updatedAt which are DateTime.
4. Please use PascalCase and singular name for models.
5. If in product's key features has multiple user personas then please Don't create separate model for each user type, instead include their relevant information in `User` model only.
7. Please keep in mind the below data type to use:
    - For date time kind of attribute use DateTime
    - for price, use Float
    - for skills, use String
    - for languages, use String

**User Model which already exists**:
model User {
    id          Int       @id @default(autoincrement())
    email       String    @unique
    password    String
    username    String
    name        String?
    role        String
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt
}
---------
Remember db schema should be complete and all the tables should be complete. If you feel something is missing, please feel free to fill in.

--------------------------------------
# Examples:
## example 1:
### Key Features:
**User Authentication**:
    - Email and Password Login/Signup: Allow students and tutors to register and log in using their email and password.
**Course Management (Tutor Role):**
    - Create Course: Tutors can create courses with details like title, description, Zoom link, price, and class slots (start and end date/time).

**Course Browsing and Enrollment (Student Role):**
    - Browse Courses: Students can view all available courses.
    - Enroll in Course: Redirect students to a payment page for enrollment.
    - Payment Processing: Handle payments for course enrollment.

**Access Control:**
    - Zoom Link Visibility: Only enrolled students can access the Zoom link for classes.

**Student Dashboard:**
    - View Enrolled Courses: Students can see and access all courses they are enrolled in.

**OUTPUT:**
```
    model User {
        id          Int       @id @default(autoincrement())
        email       String    @unique
        password    String
        username    String
        name        String?
        createdAt   DateTime  @default(now())
        updatedAt   DateTime  @updatedAt
        role        String
        courses     Course[]  @relation("CourseTutor")
        enrollments Enrollment[]
    }

    model Course {
        id         Int        @id @default(autoincrement())
        tutorId    Int
        title      String
        description String?
        zoomLink   String?
        price      Float
        createdAt  DateTime   @default(now())
        updatedAt  DateTime   @updatedAt
        tutor      User       @relation("CourseTutor", fields: [tutorId], references: [id])
        slots      CourseSlot[]
        enrollments Enrollment[]
    }

    model CourseSlot {
        id         Int      @id @default(autoincrement())
        courseId   Int
        startTime  DateTime
        endTime    DateTime
        createdAt  DateTime @default(now())
        updatedAt  DateTime @updatedAt
        course     Course   @relation(fields: [courseId], references: [id])
    }

    model Enrollment {
        id          Int      @id @default(autoincrement())
        studentId   Int
        courseId    Int
        enrollmentDate DateTime @default(now())
        paymentStatus String
        createdAt   DateTime @default(now())
        updatedAt   DateTime @updatedAt
        student     User     @relation(fields: [studentId], references: [id])
        course      Course   @relation(fields: [courseId], references: [id])
        payment     Payment?
    }

    model Payment {
        id          Int      @id @default(autoincrement())
        enrollmentId Int
        amount      Float
        paymentMethod String
        paymentDate DateTime @default(now())
        status      String
        createdAt   DateTime @default(now())
        updatedAt   DateTime @updatedAt
        enrollment  Enrollment @relation(fields: [enrollmentId], references: [id])
    }
```