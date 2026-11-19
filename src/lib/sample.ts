export const SAMPLE_TEXT = `
In order for pyruvate, the product of glycolysis, to enter the next pathway, it must undergo several changes. The conversion is a three-step process (Figure 7.10).

Step 1. A carboxyl group is removed from pyruvate, releasing a molecule of carbon dioxide into the surrounding medium. This reaction creates a two-carbon hydroxyethyl group bound to the enzyme (pyruvate dehydrogenase). We should note that this is the first of the six carbons from the original glucose molecule to be removed. (This step proceeds twice because there are two pyruvate molecules produced at the end of glycolysis for every molecule of glucose metabolized anaerobically; thus, two of the six carbons will have been removed at the end of both steps.)

Step 2. The hydroxyethyl group is oxidized to an acetyl group, and the electrons are picked up by NAD+, forming NADH. 

Step 3. The enzyme-bound acetyl group is transferred to CoA, producing a molecule of acetyl CoA.
`;

export interface SampleChip {
  id: string;
  title: string;
  category: string;
  badge: string;
  text: string;
}

export const SAMPLE_CHIPS: SampleChip[] = [
  {
    id: "krebs",
    title: "Krebs Cycle",
    category: "Biochemistry",
    badge: "Bio · Cellular Respiration",
    text: SAMPLE_TEXT.trim(),
  },
  {
    id: "quantum",
    title: "Quantum Decoherence",
    category: "Physics",
    badge: "Physics · Superposition",
    text: `Quantum decoherence is the irreversible loss of quantum coherence, whereby a quantum system transitions from a pure state exhibiting macroscopic quantum superposition to an apparent statistical mixture. When a quantum particle interacts with its thermodynamic reservoir, entanglement with environmental degrees of freedom causes the phase relations between the system's orthogonal components to disperse into the surrounding environment. Consequently, destructive interference between differing eigenstates vanishes rapidly, yielding the classical probability distributions observed in macroscopic measurements.`,
  },
  {
    id: "law",
    title: "Constitutional Law",
    category: "Jurisprudence",
    badge: "Law · Commerce Clause",
    text: `Under Article I, Section 8, Clause 3 of the United States Constitution, Congress possesses the plenary authority to regulate commerce with foreign nations and among the several states. In modern constitutional jurisprudence, this Commerce Clause power extends to three broad categories: the channels of interstate commerce, the instrumentalities of or persons and things in interstate commerce, and those economic activities that substantially affect interstate commerce in the aggregate. Even purely intrastate economic activities may be subordinated to federal preemption if their cumulative effect exerts a substantial economic impact on interstate commerce.`,
  },
];