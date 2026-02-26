"use client";

export type DriverImpact = "up" | "down" | "neutral";

export interface ScoreDriver {
  text: string;
  impact: DriverImpact;
}

export interface ScoreCategory {
  name: string;
  score: number; // 0-100
  weight: number;
  weightedScore: number;
  drivers: ScoreDriver[];
}

export interface ScoreBreakdown {
  overall: number; // 0-100
  label: string;
  color: string;
  categories: ScoreCategory[];
}

export function calculateOperatorScore(): ScoreBreakdown {
  // Financial Health (35%)
  // Based on PRIME %, Food Cost %, Labor %
  // Seed values: food 29.8%, labor 22.8%, PRIME 52.6% (from win-engine)
  const foodCost = 29.8;
  const laborCost = 22.8;
  const primeCost = foodCost + laborCost; // simplified, excludes disposables for seed

  let financialScore = 100;
  if (primeCost > 65) financialScore = 20;
  else if (primeCost > 60) financialScore = 40;
  else if (primeCost > 58) financialScore = 55;
  else if (primeCost > 55) financialScore = 70;
  else if (primeCost > 50) financialScore = 85;
  else financialScore = 95;

  const financialDrivers: ScoreDriver[] = [];
  if (foodCost < 31) {
    financialDrivers.push({ text: "Food cost under 31% benchmark", impact: "up" });
  } else {
    financialDrivers.push({
      text: `Food cost at ${foodCost}% — above 31% benchmark`,
      impact: "down",
    });
  }
  if (laborCost < 24) {
    financialDrivers.push({ text: "Labor under 24% benchmark", impact: "up" });
  } else {
    financialDrivers.push({
      text: `Labor at ${laborCost}% — above 24% benchmark`,
      impact: "down",
    });
  }
  if (primeCost < 55) {
    financialDrivers.push({ text: "PRIME cost in efficient range", impact: "up" });
  }

  // Reputation (20%)
  // Seed: 88% sentiment from Do We Suck
  const sentimentScore = 88;
  const reputationScore = sentimentScore; // direct mapping

  const reputationDrivers: ScoreDriver[] = [];
  if (sentimentScore >= 85) {
    reputationDrivers.push({
      text: "Strong online reputation across platforms",
      impact: "up",
    });
  } else if (sentimentScore >= 70) {
    reputationDrivers.push({
      text: "Reputation is solid but has room to grow",
      impact: "neutral",
    });
  } else {
    reputationDrivers.push({
      text: "Online reputation needs attention",
      impact: "down",
    });
  }
  reputationDrivers.push({
    text: "Response rate at 62% — benchmark is 90%+",
    impact: "down",
  });

  // Operational Consistency (20%)
  // Seed: 7-day streak, 5 days tracked seed
  const daysTracked = 42; // ~6 weeks
  const currentStreak = 7;
  const dataCompleteness = 85; // percentage of days with full data

  let consistencyScore = Math.min(
    100,
    (daysTracked / 90) * 40 + (currentStreak / 7) * 30 + (dataCompleteness / 100) * 30,
  );
  consistencyScore = Math.round(consistencyScore);

  const consistencyDrivers: ScoreDriver[] = [];
  if (currentStreak >= 7) {
    consistencyDrivers.push({
      text: "7-day tracking streak active",
      impact: "up",
    });
  }
  if (daysTracked >= 30) {
    consistencyDrivers.push({
      text: `${daysTracked} days of data — building a clear picture`,
      impact: "up",
    });
  } else {
    consistencyDrivers.push({
      text: `${daysTracked} days tracked — 90 days builds a complete picture`,
      impact: "neutral",
    });
  }
  if (dataCompleteness < 90) {
    consistencyDrivers.push({
      text: "Some days missing data entries",
      impact: "down",
    });
  }

  // Vendor Health (15%)
  // Seed: most vendors stable, CC processor overcharging
  const vendorStability = 75; // % of vendors with stable or decreasing pricing
  const ccAccuracy = 60; // how close effective rate is to quoted rate

  const vendorScore = Math.round(vendorStability * 0.6 + ccAccuracy * 0.4);

  const vendorDrivers: ScoreDriver[] = [];
  vendorDrivers.push({
    text: "Most vendor pricing stable month-over-month",
    impact: "up",
  });
  vendorDrivers.push({
    text: "CC effective rate above quoted rate — worth reviewing",
    impact: "down",
  });

  // Team & Systems (10%)
  // Seed: task completion, schedule adherence
  const taskCompletionRate = 78;
  const scheduleAdherence = 85; // % of shifts without overtime flags

  const teamScore = Math.round(taskCompletionRate * 0.5 + scheduleAdherence * 0.5);

  const teamDrivers: ScoreDriver[] = [];
  if (taskCompletionRate >= 90) {
    teamDrivers.push({
      text: "Task completion rate above 90%",
      impact: "up",
    });
  } else {
    teamDrivers.push({
      text: `Task completion at ${taskCompletionRate}% — benchmark is 90%+`,
      impact: "neutral",
    });
  }
  if (scheduleAdherence >= 80) {
    teamDrivers.push({
      text: "Schedule running with minimal overtime flags",
      impact: "up",
    });
  } else {
    teamDrivers.push({
      text: "Overtime flags appearing — worth reviewing schedule",
      impact: "down",
    });
  }

  // Calculate weighted overall
  const categories: ScoreCategory[] = [
    {
      name: "Financial Health",
      score: financialScore,
      weight: 0.35,
      weightedScore: Math.round(financialScore * 0.35),
      drivers: financialDrivers,
    },
    {
      name: "Reputation",
      score: reputationScore,
      weight: 0.2,
      weightedScore: Math.round(reputationScore * 0.2),
      drivers: reputationDrivers,
    },
    {
      name: "Operational Consistency",
      score: consistencyScore,
      weight: 0.2,
      weightedScore: Math.round(consistencyScore * 0.2),
      drivers: consistencyDrivers,
    },
    {
      name: "Vendor Health",
      score: vendorScore,
      weight: 0.15,
      weightedScore: Math.round(vendorScore * 0.15),
      drivers: vendorDrivers,
    },
    {
      name: "Team & Systems",
      score: teamScore,
      weight: 0.1,
      weightedScore: Math.round(teamScore * 0.1),
      drivers: teamDrivers,
    },
  ];

  const overall = categories.reduce((sum, cat) => sum + cat.weightedScore, 0);

  let label = "Critical";
  let color = "text-red-400";
  if (overall >= 80) {
    label = "Running Strong";
    color = "text-emerald-400";
  } else if (overall >= 60) {
    label = "Room to Grow";
    color = "text-amber-400";
  } else if (overall >= 40) {
    label = "Needs Attention";
    color = "text-red-400";
  }

  return { overall, label, color, categories };
}

