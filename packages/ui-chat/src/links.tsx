import { DotsCircleHorizontal, Send, CreditCard } from "tabler-icons-react";

export const links = [
    { href: "/chat/conversations", children: "Conversations", icon: <Send /> },
    { href: "#", children: "Endpoints", icon: <DotsCircleHorizontal /> },
    { href: "/chat/billing", children: "Billing", icon: <CreditCard /> },
];

export default links;
