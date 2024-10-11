import fs from "fs";
import { AzureOpenAI } from "openai";
import { configDotenv } from "dotenv";
configDotenv();
import {
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_DEPLOYMENT_NAME,
  AZURE_OPENAI_DEPLOYMENT_NAME_MINI,
  AZURE_OPENAI_ENDPOINT,
} from "./env.js";

const openai = new AzureOpenAI({
  apiKey: AZURE_OPENAI_API_KEY,
  endpoint: AZURE_OPENAI_ENDPOINT,
  deployment: AZURE_OPENAI_DEPLOYMENT_NAME,
  apiVersion: "2024-04-01-preview",
});
const openai_gpt4o_mini = new AzureOpenAI({
  apiKey: AZURE_OPENAI_API_KEY,
  endpoint: AZURE_OPENAI_ENDPOINT,
  deployment: AZURE_OPENAI_DEPLOYMENT_NAME_MINI,
  apiVersion: "2024-04-01-preview",
});

const getResponseFromLLM = async (
  userPrompt,
  systemPrompt,
  temperature = 0.2
) => {
  const message = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: message,
    temperature: temperature,
  });

  const exactResponse = response.choices[0].message?.content;
  return exactResponse;
};

async function userStoriesToDataModelPrompt(userStories) {
  try {
    let prompt = "";
    userStories?.forEach((story, index) => {
      // get the user_story title
      prompt += `${index + 1}. User Story: **${story.user_story}**\n
                  Acceptance Criteria:\n ${story.acceptance_criteria.map(
                    (criteria, idx) => {
                      return `  - ${criteria}`;
                    }
                  )}\n`;
    });
    prompt += `\n`;
    prompt += "Also, add dummy/fake data to insert in the tables.\n\n";
    return prompt;
  } catch (error) {
    console.error("Error in userStoriesToDataModelPrompt: ", error);
  }
}

function cleanDatabaseSchema(schema) {
  return schema
    .replace(/```sql/g, "")
    .replace(/```/g, "")
    .replace("prisma model", "")
    .replace("prisma", "")
    .trim();
}
function parseJsonData(data) {
  try {
    data = data
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(data);
  } catch (error) {
    console.error("Error in parseJsonData: ", error);
  }
}

const generateSchemaFromOpenAI = async (prompt) => {
  const systemPrompt = fs.readFileSync(
    "prompts/database_generation_prompt.md",
    "utf8"
  );
  const schema = await getResponseFromLLM(prompt, systemPrompt);
  return cleanDatabaseSchema(schema);
};

const generateDBSchema = async () => {
  const userStories = fs.readFileSync(
    "results/user_stories_response_v3.md",
    "utf8"
  );
  console.log("generating database schema...");
  const userStoriesPrompt = await userStoriesToDataModelPrompt(
    parseJsonData(userStories).user_stories
  );
  const prompt = `${userStoriesPrompt}\nOnly include the prisma schema in the response and no other information.`;
  const databaseSchema = await generateSchemaFromOpenAI(prompt);
  console.log("Database Schema generated successfully");
  fs.writeFileSync("results/database_schema.md", databaseSchema);
};

const requirements = `
# Blog App
## Category
Content Engagement Platform

## Key Features

1. **User Authentication**
   - **Email and Password Sign-Up/Login:** Allow users to create an account and log in to view and interact with blogs.
   - **Social Media Login:** Option for users to sign up or log in using social media accounts (e.g., Google, Facebook).

2. **Blog Creation and Management (Author Role)**
   - **Create Blog Post:** Authors can write and publish blog posts, including adding titles, content, images, and tags.
   - **Edit/Delete Blog Post:** Authors can edit or delete their existing blog posts.
   - **Draft Management:** Save blog posts as drafts before publishing.
   - **Content Scheduling:** Schedule posts to be published at a future date and time.

3. **Blog Browsing and Interaction (User Role)**
   - **Browse Blogs:** Users can browse through a list of published blogs, with filters for categories or tags.
   - **Search Functionality:** Users can search for specific blog posts using keywords.
   - **Read Blog Posts:** Users can read full blog posts with a user-friendly interface.

4. **User Engagement**
   - **Commenting System:** Users can leave comments on blog posts to engage with the content and author.
   - **Like/Dislike Feature:** Users can like or dislike blog posts to express their opinions.
   - **Share Functionality:** Users can share blog posts on social media platforms.

5. **Content Management System (CMS)**
   - **Tag and Category Management:** Organize blog posts using tags and categories for better navigation.
   - **Media Library:** Manage images and other media files used in blog posts.

6. **Basic Notification System**
   - **Email Notifications:** Notify users of new blog posts, comments on their posts, or replies to their comments.
   - **In-App Notifications:** Provide real-time notifications within the app for user interactions.

7. **User Profile Management**
   - **Profile Customization:** Users can create and customize their profiles, including profile pictures and bio.
   - **Follow Authors:** Users can follow their favorite authors to receive updates on new posts.

8. **Analytics Dashboard (Author Role)**
   - **View Engagement Metrics:** Authors can view metrics such as views, likes, and comments on their blog posts.

9. **Admin Panel**
   - **User Management:** Admins can manage user accounts, including banning or moderating users.
   - **Content Moderation:** Admins can review and moderate blog posts and comments to ensure community guidelines are followed.
`;

generateDBSchema();
