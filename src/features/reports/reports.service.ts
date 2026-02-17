import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { startOfMonth, endOfMonth } from 'date-fns';

import { Transaction } from '../../database/entities/transaction.entity';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
  ) {}

  async getMonthlyReport(user: User, year: number, month: number) {
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    /* -------------------------------------------------------------------------- */
    /*                                   SUMMARY                                  */
    /* -------------------------------------------------------------------------- */

    const summaryRaw = await this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoin('transaction.transactionType', 'type')
      .where('transaction.userId = :userId', { userId: user.id })
      .andWhere('transaction.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .select([
        `
        SUM(
          CASE 
            WHEN type.id = 1 THEN transaction.amount
            ELSE 0
          END
        ) as income
        `,
        `
        SUM(
          CASE 
            WHEN type.id = 2 THEN transaction.amount
            WHEN type.id = 3 THEN "transaction"."adminFee"
            ELSE 0
          END
        ) as expense
        `,
        `
        SUM(
          CASE 
            WHEN type.id = 3 THEN "transaction"."adminFee"
            ELSE 0
          END
        ) as admin_fee
        `,
      ])
      .getRawOne();

    const income = Number(summaryRaw?.income) || 0;
    const expense = Number(summaryRaw?.expense) || 0;
    const adminFee = Number(summaryRaw?.admin_fee) || 0;
    const balance = income - expense;

    /* -------------------------------------------------------------------------- */
    /*                          EXPENSE BREAKDOWN                                 */
    /* -------------------------------------------------------------------------- */

    const expenseRaw = await this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoin('transaction.transactionCategory', 'category')
      .leftJoin('transaction.transactionType', 'type')
      .where('transaction.userId = :userId', { userId: user.id })
      .andWhere('transaction.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .andWhere('type.id = 2')
      .select([
        'category.id as category_id',
        'category.name as category_name',
        'category.iconName as icon_name',
        'SUM(transaction.amount) as total',
      ])
      .groupBy('category.id')
      .addGroupBy('category.name')
      .addGroupBy('category.iconName')
      .orderBy('total', 'DESC')
      .getRawMany();

    const expenseCategories = expenseRaw.map((item) => {
      const total = Number(item.total);

      return {
        categoryId: Number(item.category_id),
        categoryName: item.category_name,
        iconName: item.icon_name,
        total,
        percentage:
          expense > 0 ? Number(((total / expense) * 100).toFixed(2)) : 0,
      };
    });

    const adminFeePercentage =
      expense > 0 ? Number(((adminFee / expense) * 100).toFixed(2)) : 0;

    /* -------------------------------------------------------------------------- */
    /*                          INCOME BREAKDOWN                                  */
    /* -------------------------------------------------------------------------- */

    const incomeRaw = await this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoin('transaction.transactionCategory', 'category')
      .leftJoin('transaction.transactionType', 'type')
      .where('transaction.userId = :userId', { userId: user.id })
      .andWhere('transaction.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .andWhere('type.id = 1')
      .select([
        'category.id as category_id',
        'category.name as category_name',
        'category.iconName as icon_name',
        'SUM(transaction.amount) as total',
      ])
      .groupBy('category.id')
      .addGroupBy('category.name')
      .addGroupBy('category.iconName')
      .orderBy('total', 'DESC')
      .getRawMany();

    const incomeCategories = incomeRaw.map((item) => {
      const total = Number(item.total);

      return {
        categoryId: Number(item.category_id),
        categoryName: item.category_name,
        iconName: item.icon_name,
        total,
        percentage:
          income > 0 ? Number(((total / income) * 100).toFixed(2)) : 0,
      };
    });

    /* -------------------------------------------------------------------------- */
    /*                                   RETURN                                   */
    /* -------------------------------------------------------------------------- */

    return {
      period: {
        year,
        month,
        startDate,
        endDate,
      },
      summary: {
        income,
        expense,
        balance,
      },
      breakdown: {
        expense: {
          categories: expenseCategories,
          adminFee: {
            total: adminFee,
            percentage: adminFeePercentage,
          },
        },
        income: {
          categories: incomeCategories,
        },
      },
    };
  }
}
