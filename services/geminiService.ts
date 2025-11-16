import { GoogleGenAI, Type } from "@google/genai";
// FIX: Import the 'GeneratedTimetable' type to resolve a 'Cannot find name' error and subsequent type inference issues.
// FIX: Add UserRole to the import to correctly type the currentUser parameter in the askAI function.
import type { Schedule, AIResponse, Faculty, Subject, Batch, Classroom, GeneratedTimetable, UserRole } from '../types';

const scheduleSuggestionSchema = {
  type: Type.OBJECT,
  properties: {
    isFeasible: {
      type: Type.BOOLEAN,
      description: "Whether the requested scheduling is possible without conflicts.",
    },
    reasoning: {
      type: Type.STRING,
      description: "A detailed, systematic analysis of the request formatted as a markdown list. For each constraint (Faculty, Student Batch, Room, Student Workload, Lab Requirement, Room Capacity), state if it's 'OK' or 'CONFLICT' followed by a brief explanation. For example: '- Faculty: OK - Dr. Evelyn Reed is available.\\n- Student Batch: CONFLICT - CS-A has another class scheduled.\\n- Room: OK - Room 301A is free.'",
    },
    suggestions: {
      type: Type.ARRAY,
      description: "A list of 1-3 alternative schedule slots if the original request is not feasible or optimal. These should be free slots.",
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
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
        day: { type: Type.STRING, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
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
  currentUser: Faculty,
  allSubjects: Subject[],
  allBatches: Batch[],
  allClassrooms: Classroom[]
): Promise<AIResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const fullPrompt = `
      You are an intelligent university timetable scheduling assistant. Your task is to help a faculty member schedule an extra class.

      Analyze the request from the faculty member (${currentUser.name}) in the context of the entire university's master schedule and resources.

      **University Resources:**
      - Subjects: ${JSON.stringify(allSubjects, null, 2)}
      - Student Batches: ${JSON.stringify(allBatches, null, 2)}
      - Classrooms: ${JSON.stringify(allClassrooms, null, 2)}

      **Constraints to consider:**
      1.  **No Overlaps:** The proposed time slot must be free for the specified faculty, the student batch, and the classroom.
      2.  **Student Workload:** Avoid scheduling the class if it results in the student batch having more than 3 consecutive hours of classes. Check the classes immediately before and after the proposed slot.
      3.  **Lab Requirements:** If a subject requires a lab (requiresLab: true), it MUST be scheduled in a classroom that is a lab (isLab: true).
      4.  **Classroom Capacity:** The capacity of the assigned classroom must be greater than or equal to the size of the student batch.
      5.  **Faculty Availability:** The faculty member must be free.
      6.  **Classroom Availability:** The room must be free.
      7.  **Working Hours:** Standard university classes are scheduled Monday to Friday, between 09:00 and 17:00. For this specific request to schedule an *extra* class, you can propose slots on Saturday or in the evenings up to 20:00. Treat these extended hours as exceptions for special cases like this one.

      **University Master Schedule:**
      ${JSON.stringify(masterSchedule, null, 2)}

      **Faculty Request:** "${prompt}"

      Based on this information, provide a response in the specified JSON format. If the request is feasible, populate the 'newSchedule' field. If it's not feasible, provide clear reasoning and offer alternative 'suggestions'. Your reasoning MUST be a systematic markdown list checking each constraint, including Lab Requirements and Classroom Capacity.
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


// FIX: Update the `askAI` function to accept all `UserRole` types, including 'coordinator', to resolve the type error. Also, improve the prompt logic to be specific to the user's role.
export const askAI = async (
  prompt: string,
  masterSchedule: Schedule,
  currentUser: {id: string, name: string, role: UserRole}
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const todayString = today.toLocaleDateString('en-US', options);

    let filterInstruction = '';
    switch (currentUser.role) {
      case 'faculty':
        filterInstruction = `When they ask about "my schedule" or "my classes", filter the master schedule for their events (facultyId: ${currentUser.id}).`;
        break;
      case 'student':
        filterInstruction = `When they ask about "my schedule" or "my classes", filter the master schedule for their events (batchId: ${currentUser.id}).`;
        break;
      case 'coordinator':
        filterInstruction = `When they ask about "my schedule" or "my events", filter the master schedule for their club events (coordinatorId: ${currentUser.id}).`;
        break;
      case 'admin':
        filterInstruction = `The user is an administrator and can see the entire schedule. They might ask questions about the overall schedule, not just their own.`;
        break;
    }

    const fullPrompt = `
      You are an intelligent and friendly university timetable assistant.
      Your task is to answer questions based on the provided master schedule.
      The user is ${currentUser.name}, who is a ${currentUser.role}. Tailor your response to them. ${filterInstruction}

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

const generatedTimetablesSchema = {
    type: Type.ARRAY,
    description: "An array of 4 distinct and optimized timetable versions.",
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "The name of the optimization strategy used (e.g., 'Best Faculty Utilization')." },
            reasoning: { type: Type.STRING, description: "A brief explanation of the approach taken for this optimization." },
            schedule: {
                type: Type.ARRAY,
                description: "The full list of scheduled class events for this timetable version.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        subjectId: { type: Type.STRING },
                        facultyId: { type: Type.STRING },
                        batchId: { type: Type.STRING },
                        classroomId: { type: Type.STRING },
                        day: { type: Type.STRING, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] },
                        startTime: { type: Type.STRING, description: "format HH:mm" },
                        endTime: { type: Type.STRING, description: "format HH:mm" },
                    },
                    required: ["subjectId", "facultyId", "batchId", "classroomId", "day", "startTime", "endTime"],
                }
            }
        },
        required: ["name", "reasoning", "schedule"]
    }
};


export const generateTimetables = async (
  allSubjects: Subject[],
  allBatches: Batch[],
  allClassrooms: Classroom[],
  allFaculty: Faculty[]
): Promise<Omit<GeneratedTimetable, 'metrics'>[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const fullPrompt = `
      You are an expert university timetable scheduler. Your task is to generate a complete, conflict-free weekly timetable from scratch using the provided university resources. You must generate FOUR distinct timetable versions, each optimized for a different goal.

      **University Resources:**
      - Subjects: ${JSON.stringify(allSubjects, null, 2)}
      - Student Batches: ${JSON.stringify(allBatches, null, 2)}
      - Classrooms: ${JSON.stringify(allClassrooms, null, 2)}
      - Faculty: ${JSON.stringify(allFaculty, null, 2)}

      **Hard Constraints (MUST be followed for ALL timetables):**
      1.  **No Overlaps:** A faculty member, a student batch, or a classroom cannot be in two places at once.
      2.  **Correct Faculty:** Each subject must be taught by the faculty member assigned to it.
      3.  **Lab Requirements:** Subjects with "requiresLab: true" must be scheduled in a classroom with "isLab: true".
      4.  **Classroom Capacity:** The classroom capacity must be greater than or equal to the student batch size.
      5.  **Working Hours:** All classes must be scheduled between Monday and Friday, from 09:00 to 17:00. Do not use Saturday or evening slots.
      6.  **Complete Schedule:** Ensure every subject is scheduled for each batch that should take it. Assume each batch takes every subject taught by the available faculty. The number of hours per subject per week is not strictly defined; use a reasonable distribution (e.g., 2-4 hours per subject).

      **Optimization Goals:**
      Generate FOUR separate timetables, each optimized for one of the following strategies:

      1.  **"Best Faculty Utilization":** Distribute teaching hours as evenly as possible among all faculty members throughout the week. Avoid concentrating a single faculty's classes on one or two days.
      2.  **"Best Room Utilization":** Maximize the use of all available classrooms and labs. Minimize idle/empty time slots for all rooms.
      3.  **"Least Faculty Load":** Minimize instances of faculty teaching for more than 3 consecutive hours. Prioritize breaks between classes for faculty.
      4.  **"Most Balanced Schedule":** A hybrid approach. Create a well-rounded schedule that avoids major faculty overload, prevents students from having more than 3 consecutive classes, and maintains decent room utilization.

      Provide your response as a JSON array of 4 objects, where each object represents one of the optimized timetables and includes the strategy name, a brief reasoning, and the full schedule.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: generatedTimetablesSchema,
      },
    });

    const jsonText = response.text.trim();
    // The AI response won't have metrics, so we cast it to a partial type.
    return JSON.parse(jsonText) as Omit<GeneratedTimetable, 'metrics'>[];

  } catch (error) {
    console.error("Error calling Gemini API for timetable generation:", error);
    throw new Error("Failed to generate timetables from the AI. Please check your API key and network connection.");
  }
};