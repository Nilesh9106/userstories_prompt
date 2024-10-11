model User {
    id          Int       @id @default(autoincrement())
    email       String    @unique
    password    String
    username    String
    name        String?
    role        String
    profilePic  String?
    bio         String?
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt
    posts       Post[]
    comments    Comment[]
    likes       Like[]
    followers   Follower[] @relation("UserFollowers")
    following   Follower[] @relation("UserFollowing")
    notifications Notification[]
}

model Post {
    id          Int       @id @default(autoincrement())
    authorId    Int
    title       String
    content     String
    images      String[]
    tags        String[]
    category    String
    status      String    // Published, Draft, Scheduled
    scheduledAt DateTime?
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt
    author      User      @relation(fields: [authorId], references: [id])
    comments    Comment[]
    likes       Like[]
    views       Int       @default(0)
}

model Comment {
    id          Int       @id @default(autoincrement())
    postId      Int
    userId      Int
    content     String
    createdAt   DateTime  @default(now())
    updatedAt   DateTime  @updatedAt
    post        Post      @relation(fields: [postId], references: [id])
    user        User      @relation(fields: [userId], references: [id])
}

model Like {
    id          Int       @id @default(autoincrement())
    postId      Int
    userId      Int
    type        String    // Like or Dislike
    createdAt   DateTime  @default(now())
    post        Post      @relation(fields: [postId], references: [id])
    user        User      @relation(fields: [userId], references: [id])
}

model Follower {
    id          Int       @id @default(autoincrement())
    userId      Int
    followerId  Int
    createdAt   DateTime  @default(now())
    user        User      @relation("UserFollowers", fields: [userId], references: [id])
    follower    User      @relation("UserFollowing", fields: [followerId], references: [id])
}

model Notification {
    id          Int       @id @default(autoincrement())
    userId      Int
    content     String
    read        Boolean   @default(false)
    createdAt   DateTime  @default(now())
    user        User      @relation(fields: [userId], references: [id])
}

model Media {
    id          Int       @id @default(autoincrement())
    userId      Int
    url         String
    createdAt   DateTime  @default(now())
    user        User      @relation(fields: [userId], references: [id])
}