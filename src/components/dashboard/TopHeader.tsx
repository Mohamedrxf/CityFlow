import DashboardSwitcher from "./DashboardSwitcher";

type TopHeaderProps = {
    title: string;
    subtitle: string;
};

export default function TopHeader({ title, subtitle }: TopHeaderProps) {
    return (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070b1a]/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 md:px-6">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white">{title}</h1>
                    <p className="text-xs md:text-sm text-gray-400">{subtitle}</p>
                </div>

                <DashboardSwitcher />
            </div>
        </header>
    );
}