from decimal import Decimal

def balanced(postings):
    debit=sum((Decimal(str(p["amount"])) for p in postings if p["side"]=="DEBIT"),Decimal(0))
    credit=sum((Decimal(str(p["amount"])) for p in postings if p["side"]=="CREDIT"),Decimal(0))
    return debit==credit

if __name__=="__main__":
    p=[{"side":"DEBIT","amount":"500.00"},{"side":"CREDIT","amount":"500.00"}]
    assert balanced(p)
