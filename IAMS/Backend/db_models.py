from sqlalchemy import Column, Integer, String, Date
from database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    department = Column(String)
    role = Column(String, nullable=False)
    salary = Column(Integer)  
    password = Column(String, nullable=False)
    photo = Column(String, nullable=True)


class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    date = Column(Date, nullable=False)

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee = Column(String)
    date = Column(String)
    check_in = Column(String)
    check_out = Column(String)
    status = Column(String)


class Leave(Base):
    __tablename__ = "leaves"

    id = Column(Integer, primary_key=True, index=True)

    employee = Column(String)
    leave_type = Column(String)

    from_date = Column(String)
    to_date = Column(String)

    reason = Column(String)

    status = Column(String, default="Pending")

