
interface CardProps {
    children: React.ReactNode;
}

export const Card = ({children}: CardProps)=>{
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            {children}
        </div>
    )
}