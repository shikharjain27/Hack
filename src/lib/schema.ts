import { Type } from "@google/genai";

const str = { type: Type.STRING };
const strArr = { type: Type.ARRAY, items: str };

const sentence = {
  type: Type.OBJECT,
  properties: { id: str, text: str },
  required: ["id", "text"],
  propertyOrdering: ["id", "text"],
};
const levelSentence = {
  type: Type.OBJECT,
  properties: { id: str, text: str, source_ids: strArr },
  required: ["id", "text", "source_ids"],
  propertyOrdering: ["id", "text", "source_ids"],
};
const level = { type: Type.ARRAY, items: levelSentence };

export const transformSchema = {
  type: Type.OBJECT,
  properties: {
    title: str,
    source_sentences: { type: Type.ARRAY, items: sentence },
    levels: {
      type: Type.OBJECT,
      properties: { expert: level, grade10: level, grade6: level },
      required: ["expert", "grade10", "grade6"],
      propertyOrdering: ["expert", "grade10", "grade6"],
    },
    glossary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { term: str, plain: str, emoji: str },
        required: ["term", "plain", "emoji"],
        propertyOrdering: ["term", "plain", "emoji"],
      },
    },
    concept_map: {
      type: Type.OBJECT,
      properties: {
        nodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { id: str, label: str },
            required: ["id", "label"],
            propertyOrdering: ["id", "label"],
          },
        },
        edges: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { from: str, to: str, label: str },
            required: ["from", "to", "label"],
            propertyOrdering: ["from", "to", "label"],
          },
        },
      },
      required: ["nodes", "edges"],
      propertyOrdering: ["nodes", "edges"],
    },
    quiz: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          q: str,
          options: strArr,
          answer: { type: Type.INTEGER },
          source_id: str,
          hint: str,
          explanation: str,
        },
        required: ["q", "options", "answer", "source_id"],
        propertyOrdering: ["q", "options", "answer", "source_id", "hint", "explanation"],
      },
    },
    diagram_alt_text: str,
  },
  required: ["title", "source_sentences", "levels", "glossary", "concept_map", "quiz", "diagram_alt_text"],
  propertyOrdering: ["title", "source_sentences", "levels", "glossary", "concept_map", "quiz", "diagram_alt_text"],
};

export const verifySchema = {
  type: Type.OBJECT,
  properties: {
    verdicts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { id: str, faithful: { type: Type.BOOLEAN }, dropped_facts: strArr, note: str },
        required: ["id", "faithful", "dropped_facts", "note"],
        propertyOrdering: ["id", "faithful", "dropped_facts", "note"],
      },
    },
  },
  required: ["verdicts"],
  propertyOrdering: ["verdicts"],
};
