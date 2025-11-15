import { GoogleGenAI, Type } from "@google/genai";
import type { Schedule, AIResponse, Faculty, Batch, Classroom } from '../types';

const scheduleSuggestionSchema = {
  type: Type.OBJECT,
  properties: {
    isFeasible: {
      type: Type.BOOLEAN,
      description: "Whether the requested scheduling is possible without conflicts.",
    },
    reasoning: {
      type: Type.STRING,
      description: "A detailed, systematic analysis of the request formatted as a markdown list. For each constraint (Faculty, Student Batch, Room, Student Workload), state if it's 'OK' or 'CONFLICT' followed by a brief explanation. For example: '- Faculty: OK - Dr. Evelyn Reed is available.\\n- Student Batch: CONFLICT - CS-A has another class scheduled.\\n- Room: OK - Room 301A is free.'",
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
        subjectId: { type: Type.STRING },
        facultyId: { type: Type.STRING },
        batchId: { type: Type.STRING },
        classroomId: { type: Type.STRING },
        day: { type: Type.STRING, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
        startTime: { type: Type.STRING, description: "format HH:mm" },
        endTime: { type: Type.STRING, description: "format HH:mm" },
      },
      required: ["subjectId", "facultyId", "batchId", "classroomId", "day", "startTime", "endTime"],
    },
  },
  required: ["isFeasible", "reasoning", "suggestions"],
};

export const getScheduleSuggestion = async (
  prompt: string,
  masterSchedule: Schedule,
  currentUser: Faculty
): Promise<AIResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const fullPrompt = `
      You are an intelligent university timetable scheduling assistant. Your task is to help a faculty member schedule an extra class.

      Analyze the request from the faculty member (${currentUser.name}) in the context of the entire university's master schedule and resources.

      **Constraints to consider:**
      1.  **No Overlaps:** The proposed time slot must be free for the specified faculty, the student batch, and the classroom.
      2.  **Student Workload:** Avoid scheduling the class if it results in the student batch having more than 3 consecutive hours of classes. Check the classes immediately before and after the proposed slot.
      3.  **Faculty Availability:** The faculty member must be free.
      4.  **Classroom Availability:** The room must be free.
      5.  **Working Hours:** Schedule classes only between 08:00 and 18:00.

      **University Master Schedule:**
      ${JSON.stringify(masterSchedule, null, 2)}

      **Faculty Request:** "${prompt}"

      Based on this information, provide a response in the specified JSON format. If the request is feasible, populate the 'newSchedule' field. If it's not feasible, provide clear reasoning and offer alternative 'suggestions'. Your reasoning MUST be a systematic markdown list checking each constraint.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
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
  masterSchedule: Schedule,
  currentUser: {id: string, name: string, role: 'faculty' | 'student'}
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const todayString = today.toLocaleDateString('en-US', options);

    const fullPrompt = `
      You are an intelligent and friendly university timetable assistant.
      Your task is to answer questions based on the provided master schedule.
      The user is ${currentUser.name}, who is a ${currentUser.role}. Tailor your response to them. When they ask about "my schedule" or "my classes", filter the master schedule for their events (facultyId: ${currentUser.id} or batchId: ${currentUser.id}).

      **Today is ${todayString}.**

      **University Master Schedule:**
      ${JSON.stringify(masterSchedule, null, 2)}
      
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
