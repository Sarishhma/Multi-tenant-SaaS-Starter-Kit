
// This is the only file in the entire auth module allowed to call prisma directly — 
// everything else (service, controller) goes through these functions instead.

import { prisma } from "../../../lib/prisma.js"

//create user
export  function createUser(email:string,passwordHash:string){
    return prisma.user.create({
        data:{
            email,
            password:passwordHash
        }
    })
}

export function finduserByEmail(email:string){
    return prisma.user.findUnique({
        where:{email}
    })
}
export function findUserById(id:string){
    return prisma.user.findUnique({
        where:{id}
    })
}

export function markEmailAsVerified(userId:string){
    return prisma.user.update({
        where:{id:userId},
        data:{isEmailVerified:true}

})
}
//otp queries
export function createVerificationOtp(
    userId:string,
otpHash:string,
expiresAt:Date,
){
return prisma.verificationOtp.create({
    data:{userId,otpHash,expiresAt}
})
}
export function findLatestVerificationOtp(userId:string){
    return prisma.verificationOtp.findFirst({
        where:{userId},
        orderBy:{createdAt:"desc"}
    })
}
export function incrementOtpAttempts(otpId:string){
    return prisma.verificationOtp.update({
        where:{id:otpId},
        data:{attempts:{increment:1}}
        // instead of your JavaScript code reading a number, doing math, and sending a new number back — this tells Postgres itself: 
        // "whatever the current value is at the exact moment you run this, add 1 to it, in one single indivisible operation." Postgres handles both requests one at
        //  a time internally (databases are built to do this safely),
    })
}
export function deleteVerificationOtpsForUser(userId:string){
    return prisma.verificationOtp.deleteMany({
        where:{userId}
    })
}



// This layer answers only "how do I read/write this data," never "should this be allowed."

//password reset  Otp queries

export function createPasswordResetOtp(
    userId:string,
    otpHash:string,
    expiresAt:Date
){
    return  prisma.passwordResetOtp.create({
        data:{userId,otpHash,expiresAt}
    })
}
export function findLatestPasswordResetOtp(userId:string){
    return prisma.passwordResetOtp.findFirst({
        where:{userId},
        orderBy:{createdAt:"desc"}
    })
}

export function incrementPasswordResetAttempts(otpId:string){
    return prisma.passwordResetOtp.update({
        where:{id:otpId},
        data:{attempts:{increment:1}}
    })
}

export function deletePasswordResetOtpsForUser(userId:string){
    return prisma.passwordResetOtp.deleteMany({
        where:{userId}
    })
}

export function updateUserPassword(userId:string,passwordHash:string){
    return prisma.user.update({
        where:{id:userId},
        data:{password:passwordHash}
    })

}

export function incrementFailedLoginAttempts(userId:string){
    return prisma.user.update({
        where:{id:userId},
        data:{failedLoginAttempts:{increment:1}}

    })
}

export function lockUserAccount (userId:string,lockedUntil:Date){
    return prisma.user.update({
        where:{id:userId},
        data:{lockedUntil}
    })
}

export function resetLoginAttempts(userId:string){
    return prisma.user.update({
        where :{id:userId},
        data:{failedLoginAttempts:0,lockedUntil:null}
    })
}





