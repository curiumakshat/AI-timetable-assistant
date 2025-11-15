import { GoogleGenAI, Type } from "@google/genai";
import type { Schedule, AIResponse } from '../types';

const scheduleSuggestionSchema = {
  type: Type.OBJECT,
  properties: {
    isFeasible: {
      type: Type.BOOLEAN,
      description: "Whether the requested scheduling is possible without conflicts.",
    },
    reasoning: {
      type: Type.STRING,
      description: "A detailed explanation of the decision. If not feasible, explain conflicts, student workload (e.g., more than 3 continuous hours of class), or faculty unavailability.",
    },
    suggestions: {
      type: Type.ARRAY,
      description: "A list of 1-3 alternative schedule slots if the original request is not feasible or optimal. These should be free slots.",
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
          startTime: { type: Type.STRING, description: "format HH:mm" },
          endTime: { type: Type.STRING, description: "format HH:mm" },
          room: { type: Type.STRING },
        },
        required: ["day", "startTime", "endTime", "room"],
      },
    },
    newSchedule: {
      type: Type.OBJECT,
      description: "The proposed new event details if the original request is feasible. This should not be present if isFeasible is false.",
      properties: {
        subject: { type: Type.STRING },
        faculty: { type: Type.STRING },
        batch: { type: Type.STRING },
        room: { type: Type.STRING },
        day: { type: Type.STRING, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
        startTime: { type: Type.STRING, description: "format HH:mm" },
        endTime: { type: Type.STRING, description: "format HH:mm" },
      },
      required: ["subject", "faculty", "batch", "room", "day", "startTime", "endTime"],
    },
  },
  required: ["isFeasible", "reasoning", "suggestions"],
};

export const getScheduleSuggestion = async (
  prompt: string,
  facultySchedule: Schedule,
  studentSchedule: Schedule
): Promise<AIResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const fullPrompt = `
      You are an intelligent university timetable scheduling assistant. Your task is to help schedule an extra class based on a faculty member's request.

      Analyze the following request and the provided schedules to determine feasibility and suggest optimal slots.

      **Constraints to consider:**
      1.  **No Overlaps:** The proposed time slot must be free for the specified faculty, the student batch, and the classroom.
      2.  **Student Workload:** Avoid scheduling the class if it results in the student batch having more than 3 consecutive hours of classes. Check the classes immediately before and after the proposed slot.
      3.  **Faculty Availability:** The faculty must be free during the proposed time.
      4.  **Classroom Availability:** The room must be free during the proposed time.
      5.  **Working Hours:** Schedule classes only between 09:00 and 18:00.

      **Current Faculty Schedule (Dr. Evelyn Reed):**
      ${JSON.stringify(facultySchedule, null, 2)}

      **Current Student Schedule (Batch CS-A):**
      ${JSON.stringify(studentSchedule, null, 2)}
      
      **Available Classrooms:** 301A, 302B, 401, 202, Lab 5

      **Faculty Request:** "${prompt}"

      Based on this information, provide a response in the specified JSON format. If the request is feasible, populate the 'newSchedule' field. If it's not feasible, provide clear reasoning and offer alternative 'suggestions'.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: scheduleSuggestionSchema,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as AIResponse;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get suggestions from the AI. Please check your API key and network connection.");
  }
};


export const askAI = async (
  prompt: string,
  facultySchedule: Schedule,
  studentSchedule: Schedule,
  userRole: 'faculty' | 'student'
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const fullPrompt = `
      You are an intelligent and friendly university timetable assistant.
      Your task is to answer questions based on the provided schedule data.
      The user is a ${userRole}. Tailor your response to their role. For example, if a student asks "my schedule", show the student schedule.

      **Today is Monday.**

      **Current Faculty Schedule (Dr. Evelyn Reed):**
      ${JSON.stringify(facultySchedule, null, 2)}

      **Current Student Schedule (Batch CS-A):**
      ${JSON.stringify(studentSchedule, null, 2)}
      
      **Available Classrooms & Labs:** 301A, 302B, 401, 202, Lab 5. Note that "Lab 5" is a lab.

      **User's Question:** "${prompt}"

      Based on this information, provide a concise and helpful answer.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    return response.text;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("The AI assistant is currently unavailable. Please try again later.");
  }
};
