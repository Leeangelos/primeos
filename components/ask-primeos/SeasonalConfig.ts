export type SeasonalCharacter = {
  emoji: string;
  label: string;
};

export function getSeasonalCharacter(date: Date): SeasonalCharacter {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  const year = date.getFullYear();

  // Super Bowl Sunday 2026 (one-off)
  if (year === 2026 && month === 2 && day === 8) {
    return { emoji: "🏈", label: "Game Day Coach" };
  }

  // Single-day specials
  if (month === 2 && day === 14) {
    return { emoji: "💝", label: "Love Your Margins" };
  }
  if (month === 3 && day === 17) {
    return { emoji: "🍀", label: "Lucky Margins" };
  }
  if (month === 4 && day === 1) {
    return { emoji: "🎭", label: "No Fooling" };
  }
  if (month === 5 && day === 5) {
    return { emoji: "🌮", label: "Cinco Special" };
  }
  if (month === 7 && day === 4) {
    return { emoji: "🎆", label: "Independence Rush" };
  }

  // Ranges
  if (month === 3 && day >= 18 && day <= 31) {
    return { emoji: "🏀", label: "Game Day Coach" };
  }
  if (month === 4 && day >= 1 && day <= 7) {
    return { emoji: "🏀", label: "Game Day Coach" };
  }
  if (month === 10 && day >= 1 && day <= 31) {
    return { emoji: "🎃", label: "Scary Good Margins" };
  }
  if (month === 11 && day >= 1 && day <= 27) {
    return { emoji: "🦃", label: "Holiday Rush" };
  }
  if ((month === 11 && day >= 28) || month === 12) {
    return { emoji: "🎄", label: "Holiday Rush Coach" };
  }

  // Default
  return { emoji: "🍕", label: "Ask PrimeOS" };
}

