// 컨텐츠 카탈로그 (현재는 정적, 추후 Supabase 연동 가능)
export type ContentItem = {
  id: string;
  title: string;
  description: string;
  type: "tournament";
  emoji: string;
  candidates?: string[];
};

export const CONTENTS: ContentItem[] = [
  {
    id: "superpower-tournament",
    title: "Pick Your Superpower Tournament",
    description:
      "16개의 초능력 중 당신이 가장 탐내는 능력은? 16강부터 결승까지 직접 선택하세요.",
    type: "tournament",
    emoji: "⚡",
    candidates: [
      "Teleportation",
      "Time Travel",
      "Invisibility",
      "Super Strength",
      "Flying",
      "Mind Reading",
      "Healing",
      "Telekinesis",
      "Super Speed",
      "Shape Shifting",
      "Elemental Control",
      "Immortality",
      "Cloning",
      "X-Ray Vision",
      "Memory Manipulation",
      "Luck Manipulation",
    ],
  },
];

export function getContent(id: string): ContentItem | undefined {
  return CONTENTS.find((c) => c.id === id);
}
