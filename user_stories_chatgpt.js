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

const FeedbackSchema = {
  name: "generate_feedback",
  description:
    "Generates structured feedback on user stories, focusing only on issues.",
  parameters: {
    type: "object",
    properties: {
      comments: {
        type: "array",
        items: {
          type: "string",
          description:
            "Comments addressing specific issues found in the user stories.",
        },
      },
    },
    required: ["comments"],
  },
};

const UserStoriesV1FunctionSchema = {
  name: "generate_user_stories",
  description:
    "Generates a list of detailed JSON user stories for a specific feature, breaking down the architecture and database schema design.",
  parameters: {
    type: "object",
    properties: {
      user_personas: {
        type: "array",
        description: "A list of user personas",
        items: {
          type: "string",
        },
      },
      user_stories: {
        type: "array",
        description: "A list of user stories.",
        items: {
          type: "object",
          properties: {
            user_story: {
              type: "string",
              description:
                "A brief description of the specific, actionable task.",
            },
            deliverables: {
              type: "object",
              properties: {
                architecture_design: {
                  type: "object",
                  properties: {
                    frontend: {
                      type: "object",
                      properties: {
                        private_page: {
                          type: "string",
                          description:
                            "Description of the private page where authenticated users can interact with this feature.",
                        },
                        public_page: {
                          type: "string",
                          description:
                            "Description of the public page where unauthenticated users can interact with this feature, if applicable.",
                        },
                      },
                      required: ["private_page"],
                    },
                    backend: {
                      type: "object",
                      properties: {
                        api_route: {
                          type: "string",
                          description:
                            "The API route that handles requests related to this feature.",
                        },
                      },
                      required: ["api_route"],
                    },
                  },
                  required: ["frontend", "backend"],
                },
              },
              required: ["architecture_design"],
            },
            estimation: {
              type: "number",
              description:
                "The estimated time in hours required to complete this user story.",
            },
            acceptance_criteria: {
              type: "array",
              items: {
                type: "string",
                description:
                  "The criteria that must be met for this user story to be considered complete.",
              },
              description:
                "The criteria that must be met for this user story to be considered complete.",
            },
          },
          required: [
            "user_story",
            "deliverables",
            "estimation",
            "acceptance_criteria",
          ],
        },
      },
    },
    required: ["user_stories", "user_personas"],
  },
};
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
const filePath = "results/feedbacks.json";

const askForFeedback = async (userStoriesResponse, requirements) => {
  const feedbackPrompt = `As a project manager, review the following user stories against the given requirements.
  Requirements: ${requirements} 
  User Stories: ${userStoriesResponse}
  Provide feedback if does not corresponds to requirements. Do not add comments for details not explicitly mentioned in the requirements (e.g., if blog history management isn't mentioned, don't request it in the feedback).
  STRICTLY return JSON with unique feedback for each non-compliant user story.`;

  const feedbackResponse = await getResponseFromLLMWithSchema(
    feedbackPrompt,
    "You are a project owner providing feedback on user stories.",
    FeedbackSchema, // Updated schema
    "generate_feedback" // Ensure this matches the schema name
  );

  if (feedbackResponse?.comments?.length > 0) {
    const allFeedbacks = [...feedbackResponse.comments];
    fs.writeFileSync(
      filePath,
      JSON.stringify({ comments: allFeedbacks }, null, 2)
    );
    console.log("Feedback received and saved successfully.");
    return feedbackResponse.comments;
  } else {
    console.log("No feedback provided.");
    return [];
  }
};

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

async function getResponseFromLLMWithSchema(
  userPrompt,
  systemPrompt,
  functionSchema,
  functionName,
  temperature = 0.2
) {
  const message = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: message,
    functions: [functionSchema],
    function_call: { name: functionName },
    temperature: temperature,
  });

  const functionCall = response.choices[0].message?.function_call;

  if (!functionCall || functionCall.name !== functionName) {
    throw new Error("Failed to generate user stories");
  }
  return JSON.parse(functionCall.arguments ?? "{}");
}

const generate_user_stories = async (requirements) => {
  const systemPrompt = fs.readFileSync(
    "prompts/user_stories_prompt_v2.md",
    "utf-8"
  );
  const userPrompt = `Create user stories for the given product Key Features. Key Features: \n ${requirements}.`;
  const reEvaluationSystemPrompt = `You are a Technical Lead at a tech company. 
      You have been tasked with fixing user stories which are created by product owner for the following key features: \n ${requirements}.
      Make sure the one user story is corresponding to only one task. For example if we have a user story to implement browse and search posts then we need to make it into two stories one for browse post and another for implementing search feature.
      Also make sure there is no duplicate user story. If there are duplicate user stories, remove them.
      Make sure to optimize the database_schema_design,  for example for below user story:
      User story: "As a user, I want to browse, like, and share posts created by others, so that I can explore and engage with different recipes."
      there is no need to separate table for like and share, this information should be included in posts table itself.
    `;

  console.log("Generating user stories...");
  // const userStoriesResponse = await getResponseFromLLM(
  //   userPrompt,
  //   systemPrompt
  // );
  // fs.writeFileSync("results/user_stories_response_v2.md", userStoriesResponse);
  const userStoriesResponse = fs.readFileSync(
    "results/user_stories_response1.md",
    "utf-8"
  );

  // console.log("Asking for feedback...");
  // const feedbacks = await askForFeedback(userStoriesResponse, requirements);
  const feedbacks = JSON.stringify(
    JSON.parse(fs.readFileSync("results/feedbacks.json", "utf-8")).comments
  );
  console.log("Refining user stories...");

  // using feedbacks
  // const refinedUserStories = await getResponseFromLLMWithSchema(
  //   `Fix the below user stories: \n ${userStoriesResponse}.
  //   There are few feedbacks from project manager on the user stories. Please make sure to address them. Feedbacks : ${feedbacks}
  //   STRICTLY Make sure the one user story is corresponding to only one task (e.g. 'As a User, I can signup and login...' should be separated into 'As a User, I can signup...' and 'As a User,I can login'). STRICTLY return JSON, don't include any other information.`,
  //   reEvaluationSystemPrompt,
  //   UserStoriesV1FunctionSchema,
  //   "generate_user_stories"
  // );

  //without using feedbacks
  const refinedUserStories = await getResponseFromLLMWithSchema(
    `Fix the below user stories: \n ${userStoriesResponse}.
    STRICTLY Make sure the one user story is corresponding to only one task (e.g. 'As a User, I can signup and login...' should be separated into 'As a User, I can signup...' and 'As a User,I can login'). STRICTLY return JSON, don't include any other information.`,
    reEvaluationSystemPrompt,
    UserStoriesV1FunctionSchema,
    "generate_user_stories"
  );

  fs.writeFileSync(
    "results/refined_user_stories_with_feedback.json",
    JSON.stringify(refinedUserStories)
  );
  // const refinedUserStories = JSON.parse(
  //   fs.readFileSync("results/refined_user_stories.json", "utf-8")
  // );

  console.log("User stories generated successfully.");
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

generate_user_stories(requirements);
