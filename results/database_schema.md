model User {
    id          Int       @id @default(autoincrement())
    email       String    @unique
    password    String
    username    String
    name        String?
    role        String
    profile     UserProfile?
    posts       BlogPost[]
    comments    Comment[]
    likes       Like[]
    followers   Follower[] @relation("Following", references: [id])
    following   Follower[] @relation("Followers", references: [id])
    notifications Notification[]
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt
}

model UserProfile {
    id          Int       @id @default(autoincrement())
    userId      Int       @unique
    bio         String?
    profilePic  String?
    user        User      @relation(fields: [userId], references: [id])
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt
}

model BlogPost {
    id          Int       @id @default(autoincrement())
    authorId    Int
    title       String
    content     String
    images      String[]
    tags        Tag[]
    categories  Category[]
    status      PostStatus @default(DRAFT)
    scheduledAt DateTime?
    publishedAt DateTime?
    comments    Comment[]
    likes       Like[]
    views       Int        @default(0)
    author      User       @relation(fields: [authorId], references: [id])
    createdAt   DateTime   @default(now())
    updatedAt   DateTime   @updatedAt
}

model Comment {
    id          Int       @id @default(autoincrement())
    postId      Int
    userId      Int
    content     String
    post        BlogPost  @relation(fields: [postId], references: [id])
    user        User      @relation(fields: [userId], references: [id])
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt
}

model Like {
    id          Int       @id @default(autoincrement())
    postId      Int
    userId      Int
    type        LikeType
    post        BlogPost  @relation(fields: [postId], references: [id])
    user        User      @relation(fields: [userId], references: [id])
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt
}

model Tag {
    id          Int       @id @default(autoincrement())
    name        String    @unique
    posts       BlogPost[]
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt
}

model Category {
    id          Int       @id @default(autoincrement())
    name        String    @unique
    posts       BlogPost[]
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt
}

model Follower {
    id          Int       @id @default(autoincrement())
    followerId  Int
    followingId Int
    follower    User      @relation("Following", fields: [followerId], references: [id])
    following   User      @relation("Followers", fields: [followingId], references: [id])
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt
}

model Notification {
    id          Int       @id @default(autoincrement())
    userId      Int
    content     String
    isRead      Boolean   @default(false)
    user        User      @relation(fields: [userId], references: [id])
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt
}

enum PostStatus {
    DRAFT
    PUBLISHED
    SCHEDULED
}

enum LikeType {
    LIKE
    DISLIKE
}