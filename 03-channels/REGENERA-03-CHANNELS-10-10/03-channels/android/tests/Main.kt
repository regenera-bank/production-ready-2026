package regenera.channels.android

private val uuid="123e4567-e89b-42d3-a456-426614174000"
private fun intent(state: CommandState=CommandState.READY, attest:Boolean=true, amount:String="100", binding:String="device-binding-123")=
    FinancialIntent(uuid,uuid,amount,state,binding,attest)
private fun fails(block:()->Unit):Boolean=try{block();false}catch(_:IllegalArgumentException){true}

fun main(){
    check(fails{ChannelCore.validate(intent(CommandState.UNKNOWN))})
    check(fails{ChannelCore.validate(intent(attest=false))})
    check(fails{ChannelCore.validate(intent(amount="9223372036854775808"))})
    check(fails{ChannelCore.validate(intent(binding="short"))})
    check(ChannelCore.validate(intent()).amountCents=="100")
    check(ChannelCore.canRetry(CommandState.FAILED))
    check(!ChannelCore.canRetry(CommandState.UNKNOWN))
    check(ChannelCore.sanitizeTelemetry(mapOf("route" to "/pix", "token" to "secret")).keys==setOf("route"))
    println("android: 8 testes aprovados")
}
