// TEMPORARY visual check — delete.
import { ChallanSheet } from "@/components/admin/challan/ChallanSheet";
import { CHALLAN_LETTERHEAD } from "@/config/site";

export default async function Page({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams;
  return (
    <div className="bg-sand p-4">
      <ChallanSheet
        id="challan-preview-sheet"
        business={{ name: "Artifex Furniture", address: "Plot 5, Road 3, Sector 7, Uttara, Dhaka 1230", ...CHALLAN_LETTERHEAD }}
        draft={{
          date: "2026-11-16",
          customerName: "Rahim Uddin",
          customerPhone: "01711-223344",
          customerAddress: "House 12, Road 4, Uttara, Dhaka",
          salesmanName: "Mohammad Karim Hossain",
          items: Array.from({ length: Number(process.env.N ?? 7) }, (_, i) => ({ key: i, description: `Signature L-Shape Sofa ${i + 1}`, note: "Walnut finish", quantity: "1" })),
          driverEnabled: d !== "0",
          driverName: "Abdul Malek",
          driverPhone: "",
          vehicleNumber: "Dhaka Metro-Ta 11-2233",
        }}
      />
    </div>
  );
}
