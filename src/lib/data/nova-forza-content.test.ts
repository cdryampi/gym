import { novaForzaHomeContent } from "@/lib/data/nova-forza-content";
import {
  defaultMarketingPlans,
  defaultMarketingScheduleRows,
} from "@/lib/data/marketing-content";

describe("novaForzaHomeContent", () => {
  it("keeps a featured membership and key public sections", () => {
    expect(defaultMarketingPlans.some((plan) => plan.is_featured)).toBe(true);
    expect(defaultMarketingScheduleRows).toHaveLength(3);
    expect(novaForzaHomeContent.team).toHaveLength(3);
    expect(novaForzaHomeContent.featuredProducts).toHaveLength(4);
  });
});
