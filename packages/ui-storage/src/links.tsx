import { CreditCard, Folders, Search } from "tabler-icons-react";

export const links = [
    { href: "/storage/collections", children: "Collections", icon: <Folders /> },
    { href: "#", children: "Search", icon: <Search /> },
    { href: "/storage/billing", children: "Billing", icon: <CreditCard /> },
];

export default links;
