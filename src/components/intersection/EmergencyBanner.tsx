export const EmergencyBanner = ({ reason }: { reason: string }) => (
    <div className="bg-red-600 text-white p-4 rounded-xl text-center animate-pulse">
      🚑 EMERGENCY MODE ACTIVE — {reason}
    </div>
  );
  