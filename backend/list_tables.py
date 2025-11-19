from sqlalchemy import create_engine, inspect
engine = create_engine("postgresql://postgres:postgres@localhost:5432/dicebank")
print(inspect(engine).get_table_names())
