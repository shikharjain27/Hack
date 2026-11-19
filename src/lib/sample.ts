export const SAMPLE_TEXT = `A Red-Black tree is a self-balancing binary search tree where each node stores an extra bit representing its color, designated as either RED or BLACK. To maintain approximately logarithmic tree height, the data structure strictly enforces five structural invariants: every node is colored either red or black; the root node is unconditionally black; every leaf node (represented by a NIL sentinel) is black; if a node is red, both of its immediate children must be black, which precludes consecutive red nodes along any root-to-leaf path; and for every node, all simple paths from that node to its descendant NIL leaves traverse the exact same number of black nodes, defined as the node's black-height. When an element insertion or deletion violates these invariants, the tree initiates a restoration procedure consisting of O(1) pointer restructuring tree rotations (left and right rotations) and at most O(log n) node recoloring operations. Consequently, basic dynamic-set operations including search, insertion, and deletion achieve an asymptotic upper bound of O(log n) time in the worst case.`;

export interface SampleChip {
  id: string;
  title: string;
  category: string;
  badge: string;
  text: string;
}

export const SAMPLE_CHIPS: SampleChip[] = [
  {
    id: "dsa",
    title: "Red-Black Trees",
    category: "DSA",
    badge: "DSA · Self-Balancing Trees",
    text: SAMPLE_TEXT.trim(),
  },
  {
    id: "networking",
    title: "BGP Path-Vector Routing",
    category: "Computer Networking",
    badge: "Networking · Autonomous Systems",
    text: `The Border Gateway Protocol (BGP-4) is the standardized exterior gateway routing protocol facilitating policy-driven inter-domain traffic routing across autonomous systems (AS) on the global Internet backbone. Unlike interior gateway protocols such as OSPF that calculate shortest paths using Dijkstra's algorithm across a uniform metric space, BGP functions as a path-vector protocol exchanging Network Layer Reachability Information (NLRI) over reliable Transmission Control Protocol (TCP) peering sessions on destination port 179. BGP border routers actively suppress routing loops by evaluating the mandatory AS_PATH attribute; if a router identifies its own autonomous system number (ASN) within the advertised sequence of traversed systems, the routing update is immediately discarded. Best-path determination evaluates advertised routes through a deterministic hierarchy of path attributes, sequentially prioritizing highest Local Preference (LOCAL_PREF), shortest AS_PATH hop length, lowest origin code, and lowest Multi-Exit Discriminator (MED) before evaluating interior gateway protocol tiebreakers.`,
  },
  {
    id: "os",
    title: "Virtual Memory & Paging",
    category: "Operating Systems",
    badge: "OS · Memory Management Units",
    text: `In multi-tasking operating systems, virtual memory subsystems provide hardware-enforced process memory isolation by translating non-contiguous physical DRAM frames into contiguous virtual address spaces using multi-level hierarchical page tables. When a CPU executes an instruction referencing a memory operand, the Memory Management Unit (MMU) queries the Translation Lookaside Buffer (TLB), an on-chip associative cache storing recent mappings between Virtual Page Numbers (VPN) and Physical Frame Numbers (PFN). Upon experiencing a TLB miss, a hardware or software page table walk traverses the multi-level radix directory tree (PGD, PUD, PMD, and PTE) to retrieve the physical page descriptor. If the Present bit in the resolved Page Table Entry is cleared, the processor triggers a synchronous page fault exception (Interrupt Vector 14), shifting execution to the kernel interrupt handler. The kernel validates the faulting address against the process's Virtual Memory Area (VMA) structures, initiating demand paging to allocate an available physical page frame, populate the PTE protection bits, flush stale TLB entries, and seamlessly resume thread execution.`,
  },
];
