/*
----------------------------------------------------------
홀몸의 케이스
	서클
		로테이션 해도 된다
		setScale 사용해서 크기 조정해도 된다 (타원형이 되선 안된다)

	렉탱글
		로테이션 해도 된다
		setScale 사용해서 크기 조정해도 된다 (가로세로 비율이 달라도 OK)

	폴리곤
		로테이션 해도 된다
		setScale 사용해서 크기 조정해도 된다 (가로세로 비율이 달라도 OK)

부모자식 관계의 케이스
	렉탱글 or 폴리곤이 부모일때
		부모가 회전할때 자식의 충돌체로써의 정상작동여부 (할아버지, 고조할아버지가 있어도 그들의 정보가 모두 반영됨)
		- 서클 자식: ok
		- 폴리곤 자식: ok
		- 렉탱글 자식: ok

		부모의 스케일이 변할때 자식의 충돌체로써의 정상작동여부
		- 서클 자식: 테스트 필요
		- 폴리곤 자식: 테스트 필요
		- 렉탱글 자식: 테스트 필요


	서클이 부모일때
		부모가 회전할때 자식의 충돌체로써의 정상작동여부 (할아버지, 고조할아버지가 있어도 그들의 정보가 모두 반영됨)
		- 서클 자식: ok
		- 폴리곤 자식: ok
		- 렉탱글 자식: ok

		부모의 스케일이 변할때 자식의 충돌체로써의 정상작동여부
		- 서클 자식: 테스트 필요
		- 폴리곤 자식: 테스트 필요
		- 렉탱글 자식: 테스트 필요
		(추가적으로 특히 서클의 경우는 스케일이 x,y가 동일하지 않고 타원형이 될때엔 부모 자체의 충돌체도 온전치 못함. 서클의 충돌체가 온전하려면 타원형이 되서는 안됨)

cc.Node 클래스에 덧대서 사용하고 있는 확장 프로토타입 목록
	last_moved_angle: 노드의 진행방향을 담는다
	move_speed: 노드의 이동속도
	stick_ticket: 이 속성이 존재하지 않으면 ksttool.set_seperate_stick_two_circle() 메소드로 두번째 모드로 작동시킬때 작동되지 않게된다.
	before_coordinate_x: 바로 이전 좌표
	before_coordinate_y: 바로 이전 좌표
	collider_type: 충돌체 타입
	collide_polygon: 폴리곤 패스
	option_level: 충돌체 검출 방식

----------------------------------------------------------
*/
var ksttool = {};

ksttool.math = {};
ksttool.math.HALF_PI = Math.PI / 2;
ksttool.math.EPSILON = 0.0000001; // Number.EPSILON; // 0.0000001;
ksttool.math.INFINITY = 9590000;
ksttool.math.TINYNANO = 0.00000000000052;
ksttool.CIRCLE_COLLIDER = 0;
ksttool.RECTANGLE_COLLIDER = 1;
ksttool.POLYGON_COLLIDER = 2;
ksttool.LINE_TWOPOINT_COLLIDER = 3;
ksttool.TAG_GUIDE_LINE = 10001;
ksttool.ACTIVE_INSIDE_COLLISION = true;
ksttool.OPTION_LEVEL_FULL = 0;
ksttool.OPTION_LEVEL_LIGHT = 1;

ksttool.ALIGN_VERTICAL_TOP = 0;
ksttool.ALIGN_VERTICAL_MIDDLE = 1;
ksttool.ALIGN_VERTICAL_BOTTOM = 2;
ksttool.ALIGN_VERTICAL_MATCHTOP = 6;
ksttool.ALIGN_VERTICAL_MATCHBOTTOM = 7;
ksttool.ALIGN_HORIZONTAL_LEFT = 3;
ksttool.ALIGN_HORIZONTAL_CENTER = 4;
ksttool.ALIGN_HORIZONTAL_RIGHT = 5;
ksttool.ALIGN_HORIZONTAL_MATCHLEFT = 8;
ksttool.ALIGN_HORIZONTAL_MATCHRIGHT = 9;

ksttool.VECTOR_CHAIN_TYPE_NONE = 0;
ksttool.VECTOR_CHAIN_TYPE_PLP = 1;
ksttool.VECTOR_CHAIN_TYPE_XYX = 2;

//-------------------------------------------------------------
ksttool.points_to_polypath = function (point_list) {
   // okk
   var ins = 0;
   var white_gold = [];
   point_list.forEach(po => {
      var nex = point_list[ins + 1];
      if (nex === undefined) {
         nex = point_list[0];
      }
      white_gold.push({
         first: point_list[ins],
         second: nex
      });
      ins++;
   });
   return white_gold;
};
ksttool.divide_square_into = function (width, height, piece) {
   // okk
   /*
      사각형의 둘레에 일정 간격으로 piece 갯수만큼 점을 찍은 좌표목록을 리턴합니다.
   */
   piece += 1;
   var term = ((width * 2) + (height * 2)) / (piece - 1);
   var points = [];
   for (var i = 0; i < piece - 1; i++) {
      points.push((i + 1) * term);
   }
   var side_len = [
      0,
      width,
      width + height,
      width + height + width,
      width + height + width + height
   ];
   var rtn = [];
   for (var i = 0; i < side_len.length - 1; i++) {
      for (var a = 0; a < points.length; a++) {
         var dd = points[a];
         if (side_len[i] < dd && side_len[i + 1] >= dd) {

            var side_mode = i;
            var plus_value = (dd - (side_len[i]));
            var mosori = null;
            if (side_mode == 0) {
               mosori = { x: 0 + plus_value, y: 0 };
            }
            if (side_mode == 1) {
               mosori = { x: width, y: 0 + plus_value };
            }
            if (side_mode == 2) {
               plus_value *= -1;
               mosori = { x: width + plus_value, y: height };
            }
            if (side_mode == 3) {
               plus_value *= -1;
               mosori = { x: 0, y: height + plus_value };
            }
            rtn.push(mosori);
         }
      }
   }
   return rtn;
};
//-------------------------------------------------------------
ksttool.math.get_distance_between_two_circle = function (node1, node2) {
   //ofc.no
   var aa = ksttool.math.get_distance_between_two_point(node1.getPosition(), node2.getPosition());
   var bb = ksttool.getNodeSize(node1).as_circle.r + ksttool.getNodeSize(node2).as_circle.r;
   return aa - bb;
};
ksttool.math.get_destination_point_with_angle_and_distance = function (point1, point2, base_point, power_) {
   // okk
   /*
      점(point1)과 점(point2)을 잇는 선과 평행하는 선을 base_point 를 시작점으로 같은 길이만큼 긋는다
      power_ 를 값을 주게되면 계산된 길이에 이 수치를 곱하게 된다.
   */
   var power = 0;
   if (!power_) {
      power_ = 1;
   }
   power = ksttool.math.get_distance_between_two_point(point1, point2) * power_;
   var angle = ksttool.math.convert_degrees_to_radian(ksttool.math.convert_radian_to_degrees(ksttool.math.get_angle_in_radian_between_two_points(point1, point2)));
   return {
      x: base_point.x + Math.cos(angle) * power,
      y: base_point.y + Math.sin(angle) * power
   };
};
ksttool.math.get_line_degree = function (lp1, lp2) {
   // okk
   var angle = 360 - (180 - (Math.atan2(lp1.y - lp2.y, lp1.x - lp2.x) * (180 / Math.PI)));
   if (angle == 360) {
      angle = 0;
   }
   return {
      degree: angle,
      wdgr: angle > 180 ? angle - 180 : angle
   }
};
ksttool.math.calc_angle = function (lp1, lp2, ang) {
   // okk
   /*
   lp1, lp2, 는 각각 벽이될 선의 시작점과 끝점이다.
   이 벽이될 선의 시작점과 끝점은 뒤바뀌어도 상관없다.
   ang 은 충돌체의 진행각도를 의미한다 0도는 3시방향 90도는 12시방향 180도는 9시방향 270도는 6시방향이다.
   예를들어 ang 를 270 이라고 한다면 아래방향으로 이동하고있다는 의미이다.

   즉 http://labman.phys.utk.edu/phys221core/modules/m5/images/m7p1.gif 이 그림과 같은 상황을 구해보자면
   그림에서 보면 공의 진행방향은 30도이다. 30도라는 의미는 벽의 왼쪽에서 공이 다가오고 있다는 뜻이다. 그리고 벽은 수직으로 서있다.
   calc_angle({ x: 0, y: 0 }, { x: 0, y: 1 }, 30);
   이렇게 실행하면 된다. 결과는 150도가 나온다.

    */
   var dgg = ksttool.math.get_line_degree(lp1, lp2);
   var dap = (180 - ang) - ((90 - dgg.wdgr) * 2);
   if (dap < 0) {
      dap += 360;
   }
   return dap;
};
ksttool.math.conv_degree_for_human = function (degree, rev) {
   // okk
   if (!rev) {
      degree = degree + 180;
      if (degree == 360) {
         degree = 0;
      }
   } else {
      degree -= 180;
      if (degree == -180) {
         degree = 180;
      }
   }
   return degree;
};


ksttool.stick_flying_rect_node_on_border_rect_node = function (flyNode, borderNode) {
   //ofc.no
   /*
      flyNode가 borderNode에 충돌시, flyNode를 진행했던 방향으로 빼내어 아주쬐끔떨어져있도록 하여 눈으로는 붙어있는 상태로 flyNode의 위치를 조정해준다.
      이것은 option_level = ksttool.OPTION_LEVEL_LIGHT 인 node 에 한해서 사용할 것을 권장한다.
   */
   var slfSize = ksttool.getNodeSize(flyNode).as_rectangle;
   var ateSize = ksttool.getNodeSize(borderNode).as_rectangle;
   var direction_info = ksttool.get_node_speed_and_direction_angle(flyNode);
   direction_info.last_coordinate_x = (direction_info.last_coordinate_x - (slfSize.w / 2));
   direction_info.last_coordinate_y = (cc.winSize.height - ((direction_info.last_coordinate_y + (slfSize.h / 2))));
   if (!isNaN(direction_info.last_coordinate_x) && !isNaN(direction_info.last_coordinate_y)) {
      if (direction_info.last_coordinate_x != undefined && direction_info.last_coordinate_y != undefined) {
         if (true) {
            // 두번째로 구현한 동일 코드.. 첫번째꺼보다 더 빠름..
            // var t0 = performance.now();
            var before_side_ = {
               x: direction_info.last_coordinate_x,
               y: direction_info.last_coordinate_y,
               w: slfSize.w,
               h: slfSize.h
            };
            var from_ = ksttool.check_rectangle_position(before_side_, ateSize);
            var coordinate = null;
            if (from_ == 1) {
               coordinate = { x: ateSize.x - ((slfSize.w / 2) + ksttool.math.EPSILON), y: cc.winSize.height - (ateSize.y - (slfSize.h / 2) - ksttool.math.EPSILON) };
            }
            if (from_ == 7) {
               coordinate = { x: ateSize.x - ((slfSize.w / 2) + ksttool.math.EPSILON), y: cc.winSize.height - (ateSize.y + ateSize.h + (slfSize.h / 2) + ksttool.math.EPSILON) };
            }
            if (from_ == 4) {
               coordinate = { x: ateSize.x - ((slfSize.w / 2) + ksttool.math.EPSILON), y: cc.winSize.height - (slfSize.y + slfSize.h / 2) };
            }
            if (from_ == 6) {
               coordinate = { x: (ateSize.x + ateSize.w) + ((slfSize.w / 2) + ksttool.math.EPSILON), y: cc.winSize.height - (slfSize.y + slfSize.h / 2) };
            }
            if (from_ == 8) {
               coordinate = { x: slfSize.x + slfSize.w / 2, y: cc.winSize.height - (ateSize.y + ateSize.h + (slfSize.h / 2) + ksttool.math.EPSILON) };
            }
            if (from_ == 9) {
               coordinate = { x: (ateSize.x + ateSize.w) + ((slfSize.w / 2) + ksttool.math.EPSILON), y: cc.winSize.height - (ateSize.y + ateSize.h + (slfSize.h / 2) + ksttool.math.EPSILON) };
            }
            if (from_ == 2) {
               coordinate = { x: slfSize.x + slfSize.w / 2, y: cc.winSize.height - (ateSize.y - (slfSize.h / 2) - ksttool.math.EPSILON) };
            }
            if (from_ == 3) {
               coordinate = { x: (ateSize.x + ateSize.w) + ((slfSize.w / 2) + ksttool.math.EPSILON), y: cc.winSize.height - (ateSize.y - (slfSize.h / 2) - ksttool.math.EPSILON) };
            }
            // var t1 = performance.now();
            // console.log("f1: " + (t1 - t0) + 'ms - '+counter);
            if (coordinate) {
               flyNode.setPosition(coordinate.x, coordinate.y);

            }
         }
         else {
            // 일차적으로 완성한 코드. 잘 작동함
            var t0 = performance.now();
            var current_side = slfSize;
            var before_side_ = {
               x: direction_info.last_coordinate_x,
               y: direction_info.last_coordinate_y,
               w: slfSize.w,
               h: slfSize.h
            };
            var radian = ksttool.math.get_angle_in_radian_between_two_points(current_side, before_side_);
            var degree = ksttool.math.convert_radian_to_degrees(radian);
            var loopend = false;
            var counter = 0;
            var midpoint = null;
            var ratio = 0.5;
            while (!loopend) {
               midpoint = ksttool.math.get_coordinate_between_two_points(current_side, before_side_, ratio);
               midpoint.w = slfSize.w;
               midpoint.h = slfSize.h;
               var dist_ = ksttool.get_distance_between_two_rectangle(midpoint, ateSize);
               if (dist_ != 0) {
                  before_side_ = midpoint;
                  if (dist_ < ksttool.math.EPSILON) {
                     loopend = true;
                     midpoint = ksttool.math.get_coordinate_distance_away_from_center_with_degree(-ksttool.math.EPSILON, midpoint, degree);
                  }
               }
               else {
                  current_side = midpoint;
               }
               counter++;
               if (counter > 1000) { loopend = true; } // 혹시나 하는 안전장치인데, 들어올 일이 없어야 정상상황.
            }
            var t1 = performance.now();
            console.log("f1: " + (t1 - t0) + 'ms - ' + counter);
            flyNode.setPosition(midpoint.x + (slfSize.w / 2), cc.winSize.height - (midpoint.y + (slfSize.h / 2)));
         }
      }
   }

};

ksttool.get_distance_between_two_rectangle = function (rect1, rect2) {
   // okk
   /*
      rect1와 rect2의 거리를 나타내준다. 거리는 서로의 가장 가까운 모서리로부터의 거리이다.
      겹쳐있으면 0이다.
   */
   var res = null;
   var pos = ksttool.check_rectangle_position(rect1, rect2);
   if (pos == 1) {
      res = ksttool.math.get_distance_between_two_point({ x: rect1.x + rect1.w, y: rect1.y + rect1.h }, { x: rect2.x, y: rect2.y });
   }
   if (pos == 2) {
      res = (rect2.y - (rect1.y + rect1.h));
   }
   if (pos == 3) {
      res = ksttool.math.get_distance_between_two_point({ x: rect1.x, y: rect1.y + rect1.h }, { x: rect2.x + rect2.w, y: rect2.y });
   }
   if (pos == 4) {
      res = (rect2.x - (rect1.x + rect1.w));
   }
   if (pos == 5) {
      res = 0;
   }
   if (pos == 6) {
      res = rect1.x - (rect2.x + rect2.w);
   }
   if (pos == 7) {
      res = ksttool.math.get_distance_between_two_point({ x: rect1.x + rect1.w, y: rect1.y }, { x: rect2.x, y: rect2.y + rect2.h });
   }
   if (pos == 8) {
      res = rect1.y - ((rect2.y + rect2.h));
   }
   if (pos == 9) {
      res = ksttool.math.get_distance_between_two_point({ x: rect1.x, y: rect1.y }, { x: rect2.x + rect2.w, y: rect2.y + rect2.h });
   }
   return res;
};
ksttool.check_rectangle_position = function (rect1, rect2) {
   // okk
   /*
      rect1 이 rect2 의 위치를 기준으로 어느 방향에 있는지를 나타내준다.
      겹쳐있으면 0이다.
   */
   // rect1 이 rect2 up left 에 있는지
   if ((rect2.y >= rect1.y + rect1.h) && (rect2.x >= rect1.x + rect1.w)) {
      return 1; // 
   }
   // rect1 이 rect2 up right 에 있는지
   if ((rect2.y >= rect1.y + rect1.h) && (rect2.x + rect2.w <= rect1.x)) {
      return 3; //
   }
   // rect1 이 rect2 down right 에 있는지
   if ((rect2.y + rect2.h <= rect1.y) && (rect2.x + rect2.w <= rect1.x)) {
      return 9; //
   }
   // rect1 이 rect2 down left 에 있는지
   if ((rect2.y + rect2.h <= rect1.y) && (rect2.x >= rect1.x + rect1.w)) {
      return 7; //
   }
   // 1, 3, 9, 7 케이스에 해당하지 않고, rect1 이 rect2 up 영역에 걸쳐있는지
   if ((rect2.y >= rect1.y + rect1.h)) {
      return 2; // 
   }
   // 1, 3, 9, 7 케이스에 해당하지 않고, rect1 이 rect2 down 영역에 걸쳐있는지
   if ((rect2.y + rect2.h <= rect1.y)) {
      return 8; //
   }
   // 1, 3, 9, 7 케이스에 해당하지 않고, rect1 이 rect2 left 영역에 걸쳐있는지
   if ((rect2.x >= rect1.x + rect1.w)) {
      return 4; //
   }
   // 1, 3, 9, 7 케이스에 해당하지 않고, rect1 이 rect2 right 영역에 걸쳐있는지
   if ((rect2.x + rect2.w <= rect1.x)) {
      return 6; //
   }

   return 5; // 사각형이 겹쳐짐
};


ksttool.math.set_sticked_point_on_direction_of_two_circle = function (current_position, before_one_frame, partner_position, not_compltely_stick) {
   // okk
   /*
      원과 원이 겹쳐있을때, 겹치기 직전의 위치를 토대로 진행방향을 파악하고, 진행방향의 반대방향쪽으로 겹쳐있는 원을 빼서 서로 Arc가 접하도록 해준다.
      이 메소드를 사용할때 주의사항은 partner_position 에 해당하는 node는 현재 이동중이지 않도록 하는게 좋다. 왜냐하면 서로 이동중일때 좌표가 어긋나게 되어 오작동을 하는 현상이 있다.

      current_position 는 이동체에 해당하는 원의 좌표와 반지름을 담은 오브젝트
      before_one_frame 는 이동체에 해당하는 원의 바로 이전 프레임의 좌표와 반지름을 담은 오브젝트
      partner_position 는 이동체랑 충돌한 원의 좌표와 반지름을 담은 오브젝트
      not_compltely_stick 를 true 로 주면 원과 원을 완전 접하도록 하지 않는다.
   */
   var start_time = window.performance.now();
   var check_haba = (partner_position.r * 4);
   var check_point = ksttool.math.get_coordinate_of_arc_between_center_of_the_circle_and_the_other_coordinate(check_haba, current_position, before_one_frame);
   var exploring_scope = current_position;
   var loopend = false;
   var counter = 0;
   var midpoint = null;
   while (!loopend) {
      midpoint = ksttool.math.get_coordinate_between_two_points(exploring_scope, check_point, 0.5);
      midpoint.r = current_position.r;
      if (!ksttool.check_if_two_circle_are_overlapped_with_their_center_coordinate_and_radius(partner_position, midpoint)) {
         check_point = midpoint;
         var dist = ksttool.math.get_distance_between_two_point(midpoint, partner_position) - (partner_position.r + midpoint.r);
         if (dist < 0.05) {
            loopend = true;
         }
      }
      else {
         exploring_scope = midpoint;
      }
      counter++;
      if (counter > 1000) { loopend = true; } // 혹시나 하는 안전장치인데, 들어올 일이 없어야 정상상황.
   }
   if (!not_compltely_stick) {
      var radius = midpoint.r;
      midpoint = ksttool.math.get_coordinate_of_arc_between_center_of_the_circle_and_the_other_coordinate(partner_position.r + midpoint.r + ksttool.math.EPSILON, partner_position, midpoint);
      midpoint.r = radius;
   }
   midpoint.counter = counter;
   midpoint.execute_time = window.performance.now() - start_time;
   return midpoint;
};

ksttool.math.get_coordinate_distance_away_from_center_with_degree = function (distance, center_coordinate, degree) {
   // okk
   /*
      지정한 좌표로부터 지정한 거리만큼 지정한 각도로 떨어져있는 지점의 좌표를 반환한다
      ksttool.math.get_coordinate_distance_away_from_center_with_degree(10, {x:30, y:40}, 0); // 지정 좌표로부터 오른쪽 지점
      ksttool.math.get_coordinate_distance_away_from_center_with_degree(10, {x:30, y:40}, 90); // 지정 좌표로부터 아래쪽 지점
      ksttool.math.get_coordinate_distance_away_from_center_with_degree(10, {x:30, y:40}, 180); // 지정 좌표로부터 왼쪽 지점
      ksttool.math.get_coordinate_distance_away_from_center_with_degree(10, {x:30, y:40}, 270); // 지정 좌표로부터 위쪽 지점
   */
   var angle = ksttool.math.convert_degrees_to_radian(degree);
   return {
      x: center_coordinate.x + Math.cos(angle) * distance,
      y: center_coordinate.y + Math.sin(angle) * distance
   };
};
ksttool.force_positive = function (v) {
   if (v < 0) {
      return -v;
   } else {
      return v;
   }
};
ksttool.math.get_coordinate_of_arc_between_center_of_the_circle_and_the_other_coordinate = function (radius, center_of_circle, other_point) {
   // okk
   /*
      원A가 있고, 어떤 점P이 있다는 상황에서 원A의 센터와 P 사이의 직선과 원A의 호가 교차하는 지점의 좌표를 구한다.
      만약 어떤 점이 원 안에 들어와서 호와 직선이 교차하지 않는 상황이여도 연장선상의 값을 계산해준다.
      radius: 원A의 반지름
      center_of_circle: 원A의 중심좌표 ex: {x:10,y:12}
      other_point: 어떤 점의 좌표 ex: {x:110,y:112}
   */
   var angle = ksttool.math.get_angle_in_radian_between_two_points(other_point, center_of_circle);
   return {
      x: center_of_circle.x + Math.cos(angle) * radius,
      y: center_of_circle.y + Math.sin(angle) * radius
   };
};
ksttool.math.get_angle_in_radian_between_two_points = function (point1, point2) {
   // okk
   /*
      점과 점사이의 각도를 radian 으로 리턴해줍니다.
      console.log(ksttool.math.convert_radian_to_degrees(ksttool.math.get_angle_in_radian_between_two_points({x:1, y:1}, {x:0.1, y:1}))); // 0도
      console.log(ksttool.math.convert_radian_to_degrees(ksttool.math.get_angle_in_radian_between_two_points({x:1, y:1}, {x:1, y:0.1}))); // 90도
   */
   return Math.atan2(point1.y - point2.y, point1.x - point2.x);
};
ksttool.math.get_distance_between_two_point = function (point1, point2) {
   // okk
   /*
      점과 점사이의 거리를 구합니다.
   */
   var a = point1.x - point2.x;
   var b = point1.y - point2.y;
   return Math.sqrt(a * a + b * b); // Math.hypot() 를 쓰면 a*a 이 아니라 a 라고 해주면 된다. https://msdn.microsoft.com/ko-kr/library/dn858234(v=vs.94).aspx
}
ksttool.math.get_coordinate_between_two_points = function (point1, point2, position_as_percent) {
   // okk
   /*
      직선으로 연결한 두 점사이의 지점에 해당하는 좌표를 리턴해줍니다.
      예를들어 
      ksttool.math.get_coordinate_between_two_points({x:5, y:5}, {x:10, y:5}, 0.1)
      이라고 요청하면 {x:5.5, y:5} 를 리턴해줍니다.
      즉 position_as_percent 가 0 이면 point1 의 지점
      즉 position_as_percent 가 1 이면 point2 의 지점 을 나타냅니다.
      만약 position_as_percent 가 2 라면 점과점을 그 거리만큼 벗어난 지점을 나타냅니다.
   */
   var line_length = ksttool.math.get_distance_between_two_point(point1, point2);
   return ksttool.math.get_coordinate_of_arc_between_center_of_the_circle_and_the_other_coordinate(line_length * position_as_percent, point1, point2);
};
ksttool.math.convert_radian_to_degrees = function (radian) {
   // okk
   /*
      radian 를 degrees 으로 변환해준다
   */
   return radian * (180 / Math.PI);
};
ksttool.math.convert_degrees_to_radian = function (degrees) {
   // okk
   /*
      degrees 를 radian 으로 변환해준다
   */
   return degrees * (Math.PI / 180);
};
ksttool.math.rotation_coordinate = function (point1, point2, angle_in_degrees, counter_clock_wise) {
   // okk
   /*
      point1 점을 중심점으로 point2 의 위치를 각도만큼 이동(회전)시켜준다.
      회전방향은 counter_clock_wise 를 true 로하면 반시계, false로 하면 시계방향이다. (이 부분은 다시 확인해볼 필요가 있다)
      콘솔에 아래 코드를 실행시켜보면 쉽게 알수있다.
      for(var degree=0;degree<360;degree++){var result = ksttool.math.rotation_coordinate({x:4, y:4}, {x:4, y:2}, degree);result.degree=degree;console.log(result);}
      ksttool.math.rotation_coordinate({x:4, y:4}, {x:4, y:2}, 90)
   */
   if (!counter_clock_wise) {
      angle_in_degrees = (360 - angle_in_degrees)
   }
   var radians = ksttool.math.convert_degrees_to_radian((angle_in_degrees));
   var cos = Math.cos(radians);
   var sin = Math.sin(radians);
   return {
      x: (cos * (point2.x - point1.x)) + (sin * (point2.y - point1.y)) + point1.x,
      y: (cos * (point2.y - point1.y)) - (sin * (point2.x - point1.x)) + point1.y
   };
};
ksttool.math.generate_random_value = function (min, max) {
   // okk
   /*
      랜덤값을 생성해준다.
      ksttool.math.generate_random_value(0,1) 라고하면 0이나 1이 나온다
   */
   var argc = arguments.length
   if (argc === 0) {
      min = 0
      max = 2147483647
   } else if (argc === 1) {
      throw new Error('Warning: rand() expects exactly 2 parameters, 1 given')
   }
   return Math.floor(Math.random() * (max - min + 1)) + min
};
//-------------------------------------------------------------
ksttool.rand = function (min, max) {
   // okk
   /*
      랜덤값을 생성해준다.
      ksttool.math.generate_random_value(0,1) 라고하면 0이나 1이 나온다
   */
   return ksttool.math.generate_random_value(min, max);
};
ksttool.get_node_speed_and_direction_angle = function (node) {
   // okk
   /*
      노드의 진행방향과 속도를 알려준다.
      노드가 멈춰있을때는 speed가 0이 나올것이다. 그러나 앵글은 마지막으로 이동했던때의 이동 방향이 나온다는점을 참고하라

      last_moved_angle
      하->상 ksttool.math.convert_radian_to_degrees(last_moved_angle) == -90
      우->좌 ksttool.math.convert_radian_to_degrees(last_moved_angle) == 0
      상->하 ksttool.math.convert_radian_to_degrees(last_moved_angle) == 90
      좌->우 ksttool.math.convert_radian_to_degrees(last_moved_angle) == 180
   */
   var rtn = {};

   if (!(node.move_speed == undefined || isNaN(node.move_speed))) {
      rtn.move_speed = node.move_speed;
   }
   else {
      rtn.move_speed = 0;
   }
   if (!(node.last_moved_angle == undefined || isNaN(node.last_moved_angle))) {
      rtn.last_moved_angle = node.last_moved_angle;
   }
   if (!(node.last_coordinate_x == undefined || isNaN(node.last_coordinate_x))) {
      rtn.last_coordinate_x = node.last_coordinate_x;
   }
   if (!(node.last_coordinate_y == undefined || isNaN(node.last_coordinate_y))) {
      rtn.last_coordinate_y = node.last_coordinate_y;
      // rtn.last_coordinate_y = cc.winSize.height - node.last_coordinate_y;
   }
   return rtn;
};
ksttool.update_node_move_information = function (node, current_coordinate) {
   //ofc.no
   /*
      노드의 update의 가장 바닥에 위치시켜서 node의 상태를 업데이트하는 용도로 사용하면 된다.
      이 함수에서는 노드의 이동 방향이나 속도등을 매 순간 업데이트 시켜준다.
      update 안에서 기존에 getPosition() 을 얻어온 값이 있다면 current_coordinate로 전달해주면 두번 일 하지 않아도 되어 좋다.
   */
   if (!current_coordinate) {
      current_coordinate = node.getPosition();
   }
   if (node.before_coordinate_x != current_coordinate.x || node.before_coordinate_y != current_coordinate.y) {
      node.last_moved_angle = ksttool.math.get_angle_in_radian_between_two_points({ x: node.before_coordinate_x, y: node.before_coordinate_y }, { x: current_coordinate.x, y: current_coordinate.y });
      node.last_coordinate_x = node.before_coordinate_x; //current_coordinate.x;
      node.last_coordinate_y = node.before_coordinate_y; //current_coordinate.y;
   }
   node.move_speed = ksttool.math.get_distance_between_two_point({ x: node.before_coordinate_x, y: node.before_coordinate_y }, current_coordinate);
   node.before_coordinate_x = current_coordinate.x;
   node.before_coordinate_y = current_coordinate.y;
};

ksttool.set_seperate_stick_two_circle = function (circle1, circle2, use_simple_way) {
   //ofc.no
   /*
      본 함수는 두가지 방식으로 두 원을 접합시킨다.

      1. When use_simple_way is True.
         이때는 두 원의 진행방향같은건 모두 무시하고 그냥 곧장 겹쳐진만큼 뒤로 빠꾸시켜준다.
         장점: 단 1회의 계산으로 처리 가능, stick_ticket, last_moved_angle 속성 불필요
         단점: 진행방향을 무시하다보니, 겹쳐진만큼 빠져나온 뒤의 모습은 진행방향 선상에서 이탈하게 된다 (하지만 실제 적용해보면 불편함 크게 없다)

      2. When use_simple_way is False.
         이때는 두원의 진행방향을 고려해서 접합시켜준다.
         장점: 정확한 접합.
         단점: stick_ticket, last_moved_angle 속성 필요, 최대 12번의 루프를 통한 탐색용 계산이 필요(그래도 꽤 빠르다), 접합 대상은 움직이지 않을때 사용하는것을 권장한다 그렇지않으면 오작동을 할수있다.
         이 모드를 사용할때 필요한 last_moved_angle 속성은 node의 update부분에 ksttool.update_node_move_information(this); 를 넣어주면 계속 업데이트 하게 된다.
   */
   var collider_node_ = ksttool.getNodeSize(circle1).as_circle;
   var collided_list_i = ksttool.getNodeSize(circle2).as_circle;

   var speed1 = ksttool.get_node_speed_and_direction_angle(circle1);
   var speed2 = ksttool.get_node_speed_and_direction_angle(circle2);

   var sticked = null;

   if (use_simple_way) {
      if ((speed1.move_speed > speed2.move_speed) || (speed1.move_speed == 0 && speed2.move_speed == 0)) {
         sticked = ksttool.math.get_coordinate_of_arc_between_center_of_the_circle_and_the_other_coordinate(collided_list_i.r + collider_node_.r + ksttool.math.EPSILON, collided_list_i, collider_node_);
      }
   }
   else {
      if (circle1.stick_ticket != undefined) {
         delete circle1.stick_ticket;
         delete circle2.stick_ticket;

         if (sticked == null && circle1.last_moved_angle != undefined && !isNaN(circle1.last_moved_angle)) {
            sticked = ksttool.math.set_sticked_point_on_direction_of_two_circle(collider_node_, {
               x: collider_node_.x + Math.cos(circle1.last_moved_angle * -1) * collider_node_.r,
               y: collider_node_.y + Math.sin(circle1.last_moved_angle * -1) * collider_node_.r,
               r: collider_node_.r
            }, collided_list_i);
         }
      }
   }
   if (sticked) {
      circle1.setPosition(sticked.x, cc.winSize.height - sticked.y);
   }
}

ksttool.getPosition = function (node) {
   //ofc.yes (블락니드지니어스에서)
   /*
      좌상단기준좌표계로 노드 좌표 리턴
   */
   var pos = node.getPosition();
   pos.y = cc.winSize.height - pos.y;
   return pos;
};

ksttool.setPositionTo = function (node, pos) {
   //ofc.yes (블락니드지니어스에서)
   /*
      좌상단기준좌표계로 인자를 받아서 노드 위치 반영
      부모 사이즈가 화면 사이즈랑 동일할때만 사용해야 한다.
   */
   node.setPosition(pos.x, cc.winSize.height - pos.y);
};

ksttool.getAdvPosition = function (node) {
   //ofc.yes (블락니드지니어스에서)
   var node_size = ksttool.getNodeSize(node).as_rectangle;
   var position = ksttool.getPosition(node);
   position.x -= (node_size.w / 2);
   position.y -= (node_size.h / 2);
   position.w = node_size.w;
   position.h = node_size.h;
   return position;
};

ksttool.setPositionAdvTo = function (node, pos, match_node) {
   //ofc.yes (블락니드지니어스에서)
   /*
      좌상단기준좌표계로 인자를 받아서 노드 위치 반영
   */
   if (typeof pos == 'object') {
      if (pos.hasOwnProperty('x') && pos.hasOwnProperty('y')) {
         var size_as_rect = ksttool.getNodeSize(node).as_rectangle;
         node.setPosition(pos.x + (size_as_rect.w / 2), (node.getParent().height - pos.y) + -(size_as_rect.h / 2));
      }
      else if (pos.hasOwnProperty('v') || pos.hasOwnProperty('h')) {
         var size_as_rect = ksttool.getAdvPosition(node);
         // console.log(ksttool.getAdvPosition(node));
         var posss = null;
         if (match_node != undefined && match_node != null) {
            posss = ksttool.getAdvPosition(match_node);
         }
         var x = 0;
         var y = 0;
         if (pos.hasOwnProperty('v')) {
            if (pos.v == ksttool.ALIGN_VERTICAL_MATCHTOP) {
               y = posss.y;
            }
            if (pos.v == ksttool.ALIGN_VERTICAL_MATCHBOTTOM) {
               y = posss.y - (size_as_rect.h - posss.h);
            }
            if (pos.v == ksttool.ALIGN_VERTICAL_TOP) {
               if (posss == null) {
                  y = 0;
               } else {
                  y = posss.y - size_as_rect.h;
               }
            }
            if (pos.v == ksttool.ALIGN_VERTICAL_MIDDLE) {
               if (posss == null) {
                  y = ((node.getParent().height - size_as_rect.h) / 2);
               } else {
                  y = posss.y - ((size_as_rect.h - posss.h) / 2);
               }
            }
            if (pos.v == ksttool.ALIGN_VERTICAL_BOTTOM) {
               if (posss == null) {
                  y = ((node.getParent().height - size_as_rect.h));
               } else {
                  y = posss.y + posss.h;
               }
            }
         }
         if (pos.hasOwnProperty('h')) {
            if (pos.h == ksttool.ALIGN_HORIZONTAL_MATCHLEFT) {
               x = posss.x;
            }
            if (pos.h == ksttool.ALIGN_HORIZONTAL_MATCHRIGHT) {
               x = posss.x - (size_as_rect.w - posss.w);
            }
            if (pos.h == ksttool.ALIGN_HORIZONTAL_LEFT) {
               if (posss == null) {
                  x = 0;
               } else {
                  x = posss.x - size_as_rect.w;
               }
            }
            if (pos.h == ksttool.ALIGN_HORIZONTAL_CENTER) {
               if (posss == null) {
                  x = ((node.getParent().width - size_as_rect.w) / 2);
               } else {
                  x = posss.x - ((size_as_rect.w - posss.w) / 2);
               }
            }
            if (pos.h == ksttool.ALIGN_HORIZONTAL_RIGHT) {
               if (posss == null) {
                  x = ((node.getParent().width - size_as_rect.w));
               } else {
                  x = posss.x + posss.w;
               }
            }
         }
         if (pos.hasOwnProperty('vmargin')) {
            y += pos.vmargin;
         }
         if (pos.hasOwnProperty('hmargin')) {
            x += pos.hmargin;
         }
         ksttool.setPositionAdvTo(node, { x: x, y: y }, match_node);
      }
   }
   // if(typeof pos == 'number') {


   // 	// ksttool.ALIGN_VERTICAL_TOP = 0;
   // 	// ksttool.ALIGN_VERTICAL_MIDDLE = 1;
   // 	// ksttool.ALIGN_VERTICAL_BOTTOM = 2;
   // 	// ksttool.ALIGN_HORIZONTAL_LEFT = 3;
   // 	// ksttool.ALIGN_HORIZONTAL_CENTER = 4;
   // 	// ksttool.ALIGN_HORIZONTAL_RIGHT = 5;





   // }
};

ksttool.setPositionBy = function (node, pos) {
   //ofc.yes (블락니드지니어스에서)
   /*
      좌상단기준좌표계로 인자를 받아서 노드 위치 반영
      주어진 위치로 이동하는것이 아닌 현재 위치에 주어진 위치만큼을 더해주는 것입니다.
   */
   var pos_ = null;
   if (pos.x && pos.y) {
      pos_ = node.getPosition();
   }
   if (pos.x) {
      var currentX = null;
      if (pos_ != null) {
         currentX = pos_.x;
      }
      if (currentX == null) {
         currentX = node.getPositionX();
      }
      node.setPositionX(currentX + pos.x);
   }
   if (pos.y) {
      var currentY = null;
      if (pos_ != null) {
         currentY = pos_.y;
      }
      if (currentY == null) {
         currentY = node.getPositionY();
      }
      node.setPositionY(currentY + (pos.y * -1));
   }
};

ksttool.draw_guide_line_for_polygon_collider = function (parent, node, remove) {
   //ofc.no
   while (remove && parent.getChildByTag(ksttool.TAG_GUIDE_LINE)) { parent.removeChildByTag(ksttool.TAG_GUIDE_LINE); }
   var spp = node;
   if (spp.collider_type == ksttool.RECTANGLE_COLLIDER || spp.collider_type == ksttool.POLYGON_COLLIDER) {
      var list = ksttool.get_polygon_line_path(spp);
      for (var i = 0; i < list.length; i++) {
         var line = new cc.DrawNode();
         var start_ = { x: list[i].first.x, y: cc.winSize.height - list[i].first.y };
         var end_ = { x: list[i].second.x, y: cc.winSize.height - list[i].second.y };
         line.drawSegment(start_, end_, 1);
         line.setTag(ksttool.TAG_GUIDE_LINE);
         parent.addChild(line);
      }
   }
   if (spp.collider_type == ksttool.CIRCLE_COLLIDER) {
      // console.log(1);
      var translated_box_spec = ksttool.getNodeSize(spp).as_circle;
      var line = new cc.DrawNode();
      line.drawCircle(cc.p(translated_box_spec.x, cc.winSize.height - translated_box_spec.y), translated_box_spec.r, 0, 15, true, 2);
      line.setTag(ksttool.TAG_GUIDE_LINE);
      parent.addChild(line);
   }
};

ksttool.get_min_max_value_of_polygon_list = function (value) {
   // okk
   var min_value = { x: null, y: null };
   var max_value = { x: null, y: null };
   for (var i in value) {
      var code = '';
      var code2 = '';
      code = 'x';
      code2 = 'first'; if (min_value[code] == null) { min_value[code] = value[i][code2][code]; } else { if (min_value[code] > value[i][code2][code]) { min_value[code] = value[i][code2][code]; } }
      code2 = 'second'; if (min_value[code] == null) { min_value[code] = value[i][code2][code]; } else { if (min_value[code] > value[i][code2][code]) { min_value[code] = value[i][code2][code]; } }
      code = 'y';
      code2 = 'first'; if (min_value[code] == null) { min_value[code] = value[i][code2][code]; } else { if (min_value[code] > value[i][code2][code]) { min_value[code] = value[i][code2][code]; } }
      code2 = 'second'; if (min_value[code] == null) { min_value[code] = value[i][code2][code]; } else { if (min_value[code] > value[i][code2][code]) { min_value[code] = value[i][code2][code]; } }
      code = 'x';
      code2 = 'first'; if (max_value[code] == null) { max_value[code] = value[i][code2][code]; } else { if (max_value[code] < value[i][code2][code]) { max_value[code] = value[i][code2][code]; } }
      code2 = 'second'; if (max_value[code] == null) { max_value[code] = value[i][code2][code]; } else { if (max_value[code] < value[i][code2][code]) { max_value[code] = value[i][code2][code]; } }
      code = 'y';
      code2 = 'first'; if (max_value[code] == null) { max_value[code] = value[i][code2][code]; } else { if (max_value[code] < value[i][code2][code]) { max_value[code] = value[i][code2][code]; } }
      code2 = 'second'; if (max_value[code] == null) { max_value[code] = value[i][code2][code]; } else { if (max_value[code] < value[i][code2][code]) { max_value[code] = value[i][code2][code]; } }
   }
   return { max: max_value, min: min_value };
};

//---

// 해당노드의 조상들을 리스트로 가져온다
ksttool.get_parent_node_list = function (node) {
   //ofc.yes
   var parent_list = [];
   var parent = node.getParent();
   while (parent != null) {
      parent_list.push(parent);
      parent = parent.getParent();
   }
   return parent_list;
};

// 포인트가 원안에 들어오는지 체크
// spec은 원의 정보 {x:중심점x, y:중심점y, r:반지름}
// pt 는 포인트 {x:x좌표, y:y좌표}
ksttool.checkPointIsInsideCircle = function (spec, pt) {
   // okk
   var distancesquared = (pt.x - spec.x) * (pt.x - spec.x) + (pt.y - spec.y) * (pt.y - spec.y);
   return distancesquared <= spec.r * spec.r;
};

ksttool.checkPointIsInsidePolygon = function (node_plp, pt) {
   // okk
   var poly = node_plp;
   for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
      ((poly[i]['first']['y'] <= pt['y'] && pt['y'] < poly[j]['first']['y']) || (poly[j]['first']['y'] <= pt['y'] && pt['y'] < poly[i]['first'].y))
         && (pt['x'] < (poly[j]['first']['x'] - poly[i]['first']['x']) * (pt['y'] - poly[i]['first']['y']) / (poly[j]['first']['y'] - poly[i]['first']['y']) + poly[i]['first']['x'])
         && (c = !c);
   return c;
};

ksttool.checkPointIsInsideRectangle = function (spec, pt) {
   // okk
   var between = function (min, p, max) {
      if (min < max) {
         if (p > min && p < max) {
            return true;
         }
      }

      if (min > max) {
         if (p > max && p < min) {
            return true;
         }
      }

      if (p == min || p == max) {
         return true;
      }
      return false;
   };
   return between(spec.x, pt.x, spec.x + spec.w) && between(spec.y, pt.y, spec.y + spec.h);
};

ksttool.isPointIsInsideNode = function (node, pt, node_plp, circle_spec) {
   //ofc.yes (블락니드지니어스에서)
   if (node.collider_type == ksttool.CIRCLE_COLLIDER) {
      if (!circle_spec) {
         circle_spec = ksttool.getNodeSize(node).as_circle;
      }
      return ksttool.checkPointIsInsideCircle(circle_spec, pt);
   }
   if (node.collider_type == ksttool.RECTANGLE_COLLIDER && node.option_level == ksttool.OPTION_LEVEL_LIGHT) {
      var spec = ksttool.getNodeSize(node).as_rectangle;
      return ksttool.checkPointIsInsideRectangle(spec, pt);
   }
   if (node.collider_type == ksttool.RECTANGLE_COLLIDER || node.collider_type == ksttool.POLYGON_COLLIDER) {
      if (!node_plp) {
         node_plp = ksttool.get_polygon_line_path(node);
      }
      return ksttool.checkPointIsInsidePolygon(node_plp, pt);
   }
};

ksttool.calc_center = function (node_spec) {
   // okk
   var center_point = { x: node_spec.x + (node_spec.w / 2), y: node_spec.y + (node_spec.h / 2) };
   return center_point;
};
//bull
// ksttool.math.EPSILON
ksttool.check_intersection_advanced_line_circle = function (line, circle) {
   // okk

};
ksttool.math.get_point_on_arc = function (circle, dot) {
   // okk
   /*
   circle 은 {x:100, y:100, r:50} 형태의 원의 스펙이고
   dot 은 {x:100, y:149} 형태의 점이다.
   dot이 circle의 안에 위치할때 원의 중심점으로부터 dot을 지나 닿게되는 호의 지점의 좌표를 내어준다.
   dot이 circle의 밖에 위치할때 원의 중심점으로부터 dot을 지날때 교차하게되는 호의 지점의 좌표를 내어준다.
   */
   let loop = true;
   var angle__forward = ksttool.math.get_angle_in_radian_between_two_points(circle, dot);
   var pll = circle.r;
   while (loop) {
      var rtn = ksttool.math.get_coordinate_distance_away_from_center_with_radian(pll, circle, angle__forward);
      if (ksttool.math.get_distance_between_two_point(circle, rtn) >= circle.r) {
         loop = false;
         return rtn;
      } else {
         pll += ksttool.math.EPSILON;
      }
   }
};
ksttool.check_intersection_line_circle = function (line, circle) {
   // okk
   let distance_1, distance_2;
   let msqrt = Math.sqrt;
   let mdrs = null, EPSILL = 1e-7;
   let lx = line.second.x - line.first.x, ly = line.second.y - line.first.y;
   let len = msqrt(lx * lx + ly * ly);
   let dx = lx / len, dy = ly / len;
   let t = dx * (circle.x - line.first.x) + dy * (circle.y - line.first.y);
   let ex = t * dx + line.first.x, ey = t * dy + line.first.y;
   let lec = msqrt((ex - circle.x) * (ex - circle.x) + (ey - circle.y) * (ey - circle.y));
   let get_point_on_arc = function (circle, dot) {
      /*
      circle 은 {x:100, y:100, r:50} 형태의 원의 스펙이고
      dot 은 {x:100, y:149} 형태의 점이다.
      dot이 circle의 안에 위치할때 원의 중심점으로부터 dot을 지나 닿게되는 호의 지점의 좌표를 내어준다.
      dot이 circle의 밖에 위치할때 원의 중심점으로부터 dot을 지날때 교차하게되는 호의 지점의 좌표를 내어준다.
      */
      let loop = true;
      let pll = circle.r;
      let angle = Math.atan2(circle.y - dot.y, circle.x - dot.x) + Math.PI;
      while (loop) {
         dot.x = circle.x + Math.cos(angle) * pll;
         dot.y = circle.y + Math.sin(angle) * pll;
         let a = circle.x - dot.x;
         let b = circle.y - dot.y;
         if (msqrt(a * a + b * b) >= circle.r) {
            return dot;
         } else {
            pll += EPSILL;
         }
      }
   };
   for (let bomo = 0; bomo < 3; bomo++) {
      if (bomo > 1) {
         bomo = -1;
      }
      if (true) {
         let lf1 = line.first.x - circle.x, lf2 = line.first.y - circle.y, ls1 = line.second.x - circle.x, ls2 = line.second.y - circle.y, boel = EPSILL * bomo;
         distance_1 = msqrt(lf1 * lf1 + lf2 * lf2) + boel; // ksttool.math.get_distance_between_two_point(line.first, circle) + (EPSILL * bomo);
         distance_2 = msqrt(ls1 * ls1 + ls2 * ls2) + boel; // ksttool.math.get_distance_between_two_point(line.second, circle) + (EPSILL * bomo);
      }
      let compare_1 = distance_1 >= circle.r;
      let compare_2 = distance_2 >= circle.r;
      let compare_data = compare_1 && (distance_2 < circle.r) || compare_2 && (distance_1 < circle.r);
      if (lec < circle.r) {
         let dt = msqrt(circle.r * circle.r - lec * lec) - EPSILL;
         let t_m_dt = t - dt;
         let t_p_dt = t + dt;
         //---
         let te = dx * lx + dy * ly;
         let t_m_dt_lt_0_or_t_m_dt_gt_te = t_m_dt < 0 || t_m_dt > te;
         let t_p_dt_lt_0_or_t_p_dt_gt_te = t_p_dt < 0 || t_p_dt > te;
         if (!compare_data && t_m_dt_lt_0_or_t_m_dt_gt_te && t_p_dt_lt_0_or_t_p_dt_gt_te) {
            mdrs = [];
         } else if (compare_data && t_m_dt_lt_0_or_t_m_dt_gt_te) {
            mdrs = [get_point_on_arc(circle, { x: t_p_dt * dx + line.first.x, y: t_p_dt * dy + line.first.y })];
         } else if (compare_data && t_p_dt_lt_0_or_t_p_dt_gt_te) {
            mdrs = [get_point_on_arc(circle, { x: t_m_dt * dx + line.first.x, y: t_m_dt * dy + line.first.y })];
         }
         //---         
         if (!mdrs && compare_1 && compare_2) {
            mdrs = [get_point_on_arc(circle, {
               x: t_m_dt * dx + line.first.x,
               y: t_m_dt * dy + line.first.y
            }), get_point_on_arc(circle, {
               x: t_p_dt * dx + line.first.x,
               y: t_p_dt * dy + line.first.y
            })];
         }
      } else if (lec == circle.r) {
         let result1 = { x: ex, y: ey };
         let result2 = { x: ex, y: ey };
         let angle__forward = ksttool.math.get_angle_in_radian_between_two_points(circle, result1);
         let lll = ksttool.math.get_coordinate_distance_away_from_center_with_radian(ksttool.math.get_distance_between_two_point(circle, result1) + EPSILL, circle, angle__forward);
         if (ksttool.check_intersection_line_line({ first: circle, second: lll }, line, true)) {
            result1 = get_point_on_arc(circle, result1);
            result2 = get_point_on_arc(circle, result2);
            mdrs = [result1, result2];
         }
      }
      if (!mdrs && !compare_data) {
         mdrs = [];
      }
      if (mdrs !== null || bomo == -1) {
         return mdrs;
      }
   }
   return [];
};
ksttool.check_intersection_legacy_line_circle = function (line, circle) {
   // okk
   let a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2;
   v1 = {};
   v2 = {};
   v1.x = line.second.x - line.first.x;
   v1.y = line.second.y - line.first.y;
   v2.x = line.first.x - circle.x;
   v2.y = line.first.y - circle.y;
   b = (v1.x * v2.x + v1.y * v2.y);
   c = 2 * (v1.x * v1.x + v1.y * v1.y);
   b *= -2;
   d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - circle.r * circle.r));
   if (isNaN(d)) {
      // 교차점이 없다고 판단되면 여기로 들어오는데..
      // 아래 함수 실행에서 교차점을 발견할 수도 있다.
      // 결국 교차점을 찾았는지의 최종 판결은 아래 함수에서 한다.
      // return ksttool.check_intersection_advanced_line_circle(line, circle).points;
      var result1 = null, result2 = null;
      // var NO_INTERSECTION = 0;
      // var INTERSECTION = 1;
      // var SINGLE_INTERSECTION = 2;
      // var TANGENT = 3;
      var lx = line.second.x - line.first.x;
      var ly = line.second.y - line.first.y;
      var len = Math.sqrt(lx * lx + ly * ly);
      var dx = lx / len;
      var dy = ly / len;
      var t = dx * (circle.x - line.first.x) + dy * (circle.y - line.first.y);
      var ex = t * dx + line.first.x;
      var ey = t * dy + line.first.y;
      var lec = Math.sqrt((ex - circle.x) * (ex - circle.x) + (ey - circle.y) * (ey - circle.y));
      if (lec < circle.r) {
         var dt = Math.sqrt(circle.r * circle.r - lec * lec);
         var te = dx * (line.second.x - line.first.x) + dy * (line.second.y - line.first.y);
         if (true) {
            if ((t - dt < 0 || t - dt > te) &&
               (t + dt < 0 || t + dt > te)) {
               return [];//{ points: [], case: NO_INTERSECTION };
            } else if (t - dt < 0 || t - dt > te) {
               result1 = {};
               result1.x = (t + dt) * dx + line.first.x;
               result1.y = (t + dt) * dy + line.first.y;
               return [result1];//{ points: [result1], case: SINGLE_INTERSECTION };
            } else if (t + dt < 0 || t + dt > te) {
               result1 = {};
               result1.x = (t - dt) * dx + line.first.x;
               result1.y = (t - dt) * dy + line.first.y;
               return [result1];//{ points: [result1], case: SINGLE_INTERSECTION };
            }
         }
         result1 = {};
         result2 = {};
         result1.x = (t - dt) * dx + line.first.x;
         result1.y = (t - dt) * dy + line.first.y;
         result2.x = (t + dt) * dx + line.first.x;
         result2.y = (t + dt) * dy + line.first.y;
         return [result1, result2];//{ points: [result1, result2], case: INTERSECTION };
      } else if (lec == circle.r) {
         result1 = {};
         result2 = {};
         result1.x = ex;
         result1.y = ey;
         result2.x = ex;
         result2.y = ey;
         var angle__forward = ksttool.math.get_angle_in_radian_between_two_points(circle, result1);
         var lll = ksttool.math.get_coordinate_distance_away_from_center_with_radian(ksttool.math.get_distance_between_two_point(circle, result1) + ksttool.math.EPSILON, circle, angle__forward);
         if (ksttool.check_intersection_line_line({ first: circle, second: lll }, line, true)) {
            return [result1, result2];//{ points: , case: TANGENT };
         }
      }
      return [];//{ points: [], case: NO_INTERSECTION };
   }
   u1 = (b - d) / c;
   u2 = (b + d) / c;
   retP1 = {};
   retP2 = {};

   let calc_list = [
      0,
      -ksttool.math.EPSILON,
      ksttool.math.EPSILON
   ];
   ret = [];
   var len_ = calc_list.length;
   let i = null;
   for (i = 0; i < len_; i++) {
      if (u1 + calc_list[i] <= 1 && u1 + calc_list[i] >= 0) {  // add point if on the line segment
         retP1.x = line.first.x + v1.x * (u1 + calc_list[i]);
         retP1.y = line.first.y + v1.y * (u1 + calc_list[i]);
         ret[0] = retP1;
         break;
      }
   }
   for (i = 0; i < len_; i++) {
      if (u2 + calc_list[i] <= 1 && u2 + calc_list[i] >= 0) {  // second add point if on the line segment
         retP2.x = line.first.x + v1.x * (u2 + calc_list[i]);
         retP2.y = line.first.y + v1.y * (u2 + calc_list[i]);
         ret[ret.length] = retP2;
         break;
      }
   }
   return ret;
};
ksttool.check_intersection_rect_rect = function (r1, r2) {
   // okk
   return !(r2.left > r1.right || r2.right < r1.left || r2.top < r1.bottom || r2.bottom > r1.top);
};
ksttool.check_intersection_two_line = function (line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY, mode) {
   // okk
   /*
   두 선이 교차하는지를 판별한다.
    */
   // http://jsfiddle.net/justin_c_rounds/Gd2S2/light/
   var denominator, a, b, numerator1, numerator2;
   denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
   if (denominator == 0) {
      return false;
   }
   a = line1StartY - line2StartY;
   b = line1StartX - line2StartX;
   numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
   numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
   a = numerator1 / denominator;
   b = numerator2 / denominator;
   if (mode) {
      return {
         x: line1StartX + (a * (line1EndX - line1StartX)),
         y: line1StartY + (a * (line1EndY - line1StartY)),
         onLine1: a > 0 && a < 1,
         onLine2: b > 0 && b < 1
      };
   } else {
      if (a > 0 && a < 1 && b > 0 && b < 1) {
         return {
            x: line1StartX + (a * (line1EndX - line1StartX)),
            y: line1StartY + (a * (line1EndY - line1StartY))
         };
      }
   }
   return false;
};

ksttool.check_intersection_line_line = function (l1, l2, new_mode) {
   // okk
   if (new_mode) {
      return ksttool.check_intersection_two_line(l1.first.x, l1.first.y, l1.second.x, l1.second.y, l2.first.x, l2.first.y, l2.second.x, l2.second.y, false);
   } else {
      let a = l1;
      let b = l2;
      var x1 = a.first.x;
      var y1 = a.first.y;
      var x2 = a.second.x;
      var y2 = a.second.y;
      var x3 = b.first.x;
      var y3 = b.first.y;
      var x4 = b.second.x;
      var y4 = b.second.y;
      var between = function (a, b, c) {
         return a - ksttool.math.EPSILON <= b && b <= c + ksttool.math.EPSILON;
      };
      var x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) /
         ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
      var y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) /
         ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4));
      if (isNaN(x) || isNaN(y)) {
         return false;
      } else {
         if (x1 >= x2) {
            if (!between(x2, x, x1)) { return false; }
         } else {
            if (!between(x1, x, x2)) { return false; }
         }
         if (y1 >= y2) {
            if (!between(y2, y, y1)) { return false; }
         } else {
            if (!between(y1, y, y2)) { return false; }
         }
         if (x3 >= x4) {
            if (!between(x4, x, x3)) { return false; }
         } else {
            if (!between(x3, x, x4)) { return false; }
         }
         if (y3 >= y4) {
            if (!between(y4, y, y3)) { return false; }
         } else {
            if (!between(y3, y, y4)) { return false; }
         }
      }
      return { x: x, y: y };
   }
};

// - - - - -- 

ksttool.getNodeSize = function (node, posvar) {
   //ofc.yes
   /*
      이 메소드는 좌표는 노드의 중심점이라는 가정하에 작동한다.
      리턴값의 형태는 node의 종류에 따라 조금 다르다.

      모든경우 공통 항목
      - x: 실제 화면상에서 눈으로 본!
      - y: 실제 화면상에서 눈으로 본!
      - scaleX: 실제 화면상에서 눈으로 본!
      - scaleY: 실제 화면상에서 눈으로 본!
      - rotationX: 실제 화면상에서 눈으로 본!
      - rotationY: 실제 화면상에서 눈으로 본!

      circle 에서만의 항목
      - r: 실제 화면상에서 눈으로 본!

      polygon, rectangle 에서만의 항목
      - w: 실제 화면상에서 눈으로 본!
      - h: 실제 화면상에서 눈으로 본!
      - contentSizeW: getContentSize() 로 얻은 width 크기
      - contentSizeH: getContentSize() 로 얻은 height 크기
   */
   var option_level = node.option_level;
   if (!option_level) {
      option_level = ksttool.OPTION_LEVEL_FULL;
   }
   if (!posvar) {
      posvar = node.getPosition();
   }
   if (option_level == ksttool.OPTION_LEVEL_LIGHT) {
      /*
         이 옵션에서는 회전정보, 부모속성이 무시됩니다.
         그렇기 때문에 다음 상황에서만 본 모드를 사용할 수 있습니다.
         - 모든 충돌체의 부모는 나와 같은 부모여야 한다.
         - 부모의 스케일은 1 이여야 한다.
         - 부모의 로테이션은 0 이여야 한다.
         - 부모의 포지션은 x:0, y:0 이여야 한다.
      */
      if (node.collider_type == ksttool.CIRCLE_COLLIDER) {
         var position_of_node = posvar;
         var contentSize = node.getContentSize(); // getBoundingBox() 는 getContentSize() 에 비해 비용이 꽤나 차이나게 비싸다.
         contentSize.width *= node.getScaleX();
         contentSize.height *= node.getScaleY();
         var trans_rect_x = position_of_node.x - (contentSize.width / 2);
         var trans_rect_y = cc.winSize.height - (position_of_node.y - (contentSize.height / 2)) - contentSize.height;
         var calc_width = 0;
         var calc_height = 0;
         var circle_width = contentSize.width / 2;
         var circle_height = contentSize.height / 2;
         var circle_radius = 0;
         if (circle_width > circle_height) {
            circle_radius = circle_height;
            calc_height = (circle_width - circle_height);
         }
         else {
            circle_radius = circle_width;
            calc_width = (circle_height - circle_width);
         }
         var trans_circle = {
            x: trans_rect_x + circle_width - calc_height,
            y: trans_rect_y + circle_height - calc_width,
            r: circle_radius
         };
         return { as_circle: trans_circle };
      }
      else if (node.collider_type == ksttool.RECTANGLE_COLLIDER) {
         var position_of_node = posvar;
         var contentSize = node.getContentSize(); // getBoundingBox() 는 getContentSize() 에 비해 비용이 꽤나 차이나게 비싸다.
         contentSize.width *= node.getScaleX();
         contentSize.height *= node.getScaleY();
         return {
            as_rectangle: {
               x: position_of_node.x - (contentSize.width / 2),
               y: (cc.winSize.height - (position_of_node.y + (contentSize.height / 2))),
               w: contentSize.width,
               h: contentSize.height
            }
         };
      }
      else {
         console.log('LIGHT option does not support polygon');
      }
   }
   else if (option_level == ksttool.OPTION_LEVEL_FULL) {
      var related_position = posvar;
      var world_space_position_of_node = (node.getParent()).convertToWorldSpace(related_position);
      var contentSize = node.getContentSize();
      var scaleX = node.getScaleX();
      var scaleY = node.getScaleY();
      var accumulate_reflection = {};
      accumulate_reflection['rotationX'] = node.getRotationX();
      accumulate_reflection['rotationY'] = node.getRotationY();
      accumulate_reflection['scaleX'] = scaleX;
      accumulate_reflection['scaleY'] = scaleY;
      accumulate_reflection = ksttool.accumulate_reflection(node, accumulate_reflection);
      scaleX = accumulate_reflection.scaleX;
      scaleY = accumulate_reflection.scaleY;
      var width = contentSize.width * scaleX;
      var height = contentSize.height * scaleY;
      var x = world_space_position_of_node.x - (width / 2);
      var y = world_space_position_of_node.y - (height / 2);
      var trans_rect = {
         x: x,
         y: cc.winSize.height - y - height,
         w: width,
         h: height,
         contentSizeW: contentSize.width,
         contentSizeH: contentSize.height,
         scaleX: scaleX,
         scaleY: scaleY,
         rotationX: accumulate_reflection.rotationX,
         rotationY: accumulate_reflection.rotationY
      };
      if (node.collider_type != ksttool.CIRCLE_COLLIDER) {
         return {
            as_rectangle: trans_rect
         };
      }

      var circle_width = trans_rect.w / 2;
      var circle_height = trans_rect.h / 2;
      var circle_radius = circle_width > circle_height ? circle_height : circle_width;

      var calc_width = 0;
      var calc_height = 0;
      if (circle_width < circle_height) {
         calc_width = (circle_height - circle_width);
      }
      else {
         calc_height = (circle_width - circle_height);
      }
      var trans_circle = {
         x: trans_rect.x + circle_width - calc_height,
         y: trans_rect.y + circle_height - calc_width,
         r: circle_radius,
         scaleX: trans_rect.scaleX,
         scaleY: trans_rect.scaleY,
         rotationX: trans_rect.rotationX,
         rotationY: trans_rect.rotationY
      };

      return {
         as_circle: trans_circle
      };
   }
   else {
      console.log('구현되지 않은 옵션입니다');
      return null;
   }
};
ksttool.get_polygon_line_path = function (node) {
   //ofc.yes
   var translated_box_spec = ksttool.getNodeSize(node).as_rectangle;
   var list = null;
   if (node.collider_type == ksttool.POLYGON_COLLIDER) {
      if (node.hasOwnProperty('collide_polygon')) {
         list = node.collide_polygon.path;
      }
      else if (node.get_custom_box_attr('polygon_path')) {
         var full_height = $cc.ccoo(cocosKst.const.sizeRatio.height);
         var uher = (0 - full_height) + (node.parent.getPosition().y * 2);
         var wwhy = ((-node.parent.getPosition().y) + full_height);
         var white_gold = node.get_custom_box_attr('polygon_path');
         var new_arr = [];
         white_gold.forEach(coo => {
            new_arr.push({
               first: {
                  x: (coo.first.x) - node.parent.getPosition().x,
                  y: uher - ((coo.first.y) - wwhy)
               },
               second: {
                  x: (coo.second.x) - node.parent.getPosition().x,
                  y: uher - ((coo.second.y) - wwhy)
               }
            });
         });
         list = new_arr;
      }
   }
   else if (node.collider_type == ksttool.RECTANGLE_COLLIDER) {
      if (node.option_level == ksttool.OPTION_LEVEL_LIGHT) {
         return [
            { first: { x: translated_box_spec.x, y: translated_box_spec.y }, second: { x: translated_box_spec.x, y: translated_box_spec.y + translated_box_spec.h } },
            { first: { x: translated_box_spec.x, y: translated_box_spec.y + translated_box_spec.h }, second: { x: translated_box_spec.x + translated_box_spec.w, y: translated_box_spec.y + translated_box_spec.h } },
            { first: { x: translated_box_spec.x + translated_box_spec.w, y: translated_box_spec.y + translated_box_spec.h }, second: { x: translated_box_spec.x + translated_box_spec.w, y: translated_box_spec.y } },
            { first: { x: translated_box_spec.x + translated_box_spec.w, y: translated_box_spec.y }, second: { x: translated_box_spec.x, y: translated_box_spec.y } }
         ];
      }
      list = [
         { first: { x: 0, y: 0 }, second: { x: 0, y: translated_box_spec.contentSizeH } },
         { first: { x: 0, y: translated_box_spec.contentSizeH }, second: { x: translated_box_spec.contentSizeW, y: translated_box_spec.contentSizeH } },
         { first: { x: translated_box_spec.contentSizeW, y: translated_box_spec.contentSizeH }, second: { x: translated_box_spec.contentSizeW, y: 0 } },
         { first: { x: translated_box_spec.contentSizeW, y: 0 }, second: { x: 0, y: 0 } }
      ];
   }
   list = ksttool.calculate_duplicate_plp(list, translated_box_spec);
   if (false && cc.hasOwnProperty('kst_custom_maincont')) {
      var containerPosition = cc.kst_custom_maincont.getPosition();
      list.forEach(adf => {
         adf.first.x -= containerPosition.x;
         adf.second.x -= containerPosition.x;
         adf.first.y -= containerPosition.y;
         adf.second.y -= containerPosition.y;
      });
   }
   return list;
};
ksttool.accumulate_reflection = function (node, node_spec) {
   //ofc.yes
   if (!node_spec) {
      if (node.collider_type == ksttool.CIRCLE_COLLIDER) {
         node_spec = ksttool.getNodeSize(node).as_circle;
      }
      else {
         node_spec = ksttool.getNodeSize(node).as_rectangle;
      }
   }
   var accumulate_reflection = {};
   accumulate_reflection['rotationX'] = node_spec.rotationX;
   accumulate_reflection['rotationY'] = node_spec.rotationY;
   accumulate_reflection['scaleX'] = node_spec.scaleX;
   accumulate_reflection['scaleY'] = node_spec.scaleY;
   var node_tree = ksttool.get_parent_node_list(node);
   for (var i = 0; i < node_tree.length; i++) {
      if (node_tree[i] != null && node_tree[i] instanceof cc.Node) {
         accumulate_reflection['rotationX'] += node_tree[i].getRotationX();
         accumulate_reflection['rotationY'] += node_tree[i].getRotationY();
         accumulate_reflection['scaleX'] *= node_tree[i].getScaleX();
         accumulate_reflection['scaleY'] *= node_tree[i].getScaleY();
      }
   }
   return accumulate_reflection;
};
ksttool.calculate_duplicate_plp = function (line_list, node_spec) {
   // okk
   var clone_list = [];
   var distance_fix_x = 0;
   var distance_fix_y = 0;


   for (var i = 0; i < line_list.length; i++) {
      var line = {
         first: {
            x: line_list[i].first.x * node_spec.scaleX + node_spec.x + distance_fix_x,
            y: line_list[i].first.y * node_spec.scaleY + node_spec.y + distance_fix_y
         },
         second: {
            x: line_list[i].second.x * node_spec.scaleX + node_spec.x + distance_fix_x,
            y: line_list[i].second.y * node_spec.scaleY + node_spec.y + distance_fix_y
         }
      };
      if (node_spec.rotationX != 0 && node_spec.rotationX != 360) {
         var center_point = ksttool.calc_center(node_spec);
         line.first = ksttool.math.rotation_coordinate(center_point, line.first, node_spec.rotationX, false);
         line.second = ksttool.math.rotation_coordinate(center_point, line.second, node_spec.rotationX, false);
      }
      clone_list.push(line);
   }
   return clone_list;
};

ksttool.check_collision_rectangle_circle = function (node_rect, node_circle) {
   //ofc.no
   var collide_inside = false;
   var rect = ksttool.getNodeSize(node_rect).as_rectangle;
   var circle = ksttool.getNodeSize(node_circle).as_circle;

   // compute a center-to-center vector
   var half = { x: rect.w / 2, y: rect.h / 2 };
   var center = {
      x: circle.x - (rect.x + half.x),
      y: circle.y - (rect.y + half.y)
   };

   // check circle position inside the rectangle quadrant
   var side = {
      x: Math.abs(center.x) - half.x,
      y: Math.abs(center.y) - half.y
   };
   if (side.x > circle.r || side.y > circle.r) // outside
      return false;
   if (side.x < -circle.r && side.y < -circle.r) // inside
      return collide_inside;
   if (side.x < 0 || side.y < 0) // intersects side or corner
      return true;

   // circle is near the corner
   return side.x * side.x + side.y * side.y < circle.r * circle.r;
};
ksttool.get_circle_info = function (circle, vpos) {
   //ofc.yes
   var circle_info = ksttool.getNodeSize(circle).as_circle;
   if (vpos) {
      circle_info.x = vpos.x;
      circle_info.y = vpos.y;
   } else {
      circle_info.x = circle.getPositionX();
      circle_info.y = circle.getPositionY();
   }
   circle_info.r2 = circle_info.r * 2;
   return circle_info;
};
ksttool.get_point_on_the_line = function (distance, direction) {
   // okk
   var angle = null;
   if (direction.hasOwnProperty('angle')) {
      angle = direction.angle;
   } else {
      angle = ksttool.math.get_angle_in_radian_between_two_points(direction.to, direction.from);
   }
   return {
      x: direction.from.x + Math.cos(angle) * distance,
      y: direction.from.y + Math.sin(angle) * distance
   };
};
ksttool.check_collision_circle_circle = function (collider_node1, collider_node2) {
   //ofc.no
   var circle1 = ksttool.getNodeSize(collider_node1).as_circle;
   var circle2 = ksttool.getNodeSize(collider_node2).as_circle;
   return ksttool.check_if_two_circle_are_overlapped_with_their_center_coordinate_and_radius(circle1, circle2);
};
ksttool.check_if_two_circle_are_overlapped_with_their_center_coordinate_and_radius = function (circle1, circle2) {
   // okk
   var x = circle1.x - circle2.x;
   var y = circle1.y - circle2.y;
   return (circle1.r + circle2.r) > Math.sqrt((x * x) + (y * y));
};
ksttool.check_collision_polygon_circle = function (polygon_splite, circle) {
   //ofc.no
   if (polygon_splite.collider_type == ksttool.RECTANGLE_COLLIDER && polygon_splite.option_level == ksttool.OPTION_LEVEL_LIGHT && circle.option_level == ksttool.OPTION_LEVEL_LIGHT) {
      return ksttool.check_collision_rectangle_circle(polygon_splite, circle);
   }
   //-----
   var collided = false;
   var line_list = ksttool.get_polygon_line_path(polygon_splite);
   var circle_spec = ksttool.getNodeSize(circle).as_circle;
   for (var i = 0; i < line_list.length && !collided; i++) {
      collided = (ksttool.check_intersection_line_circle(line_list[i], circle_spec)).length != 0;
   }
   if (ksttool.ACTIVE_INSIDE_COLLISION && !collided) {
      // 폴리곤이 서클을 품어야 옳게 작동된다.
      collided = ksttool.isPointIsInsideNode(polygon_splite, { x: circle_spec.x, y: circle_spec.y }, line_list);
      if (!collided) {
         // 폴리곤이 서클을 품지못한 경우 반대의 입장에서 비교한다.
         // 폴리곤의 점 하나하나가 서클안에 들어왔는지를 확인한다.
         if (polygon_splite.collider_type == ksttool.POLYGON_COLLIDER) {
            var list = line_list;//ksttool.get_polygon_line_path(polygon_splite);
            for (var i = 0; !collided && i < list.length; i++) {
               collided = ksttool.checkPointIsInsideCircle(circle_spec, list[i].first);
            }
         }
      }
   }
   return collided;
};

ksttool.check_collision_polygon_polygon = function (node1, node2) {
   //ofc.no
   if (node1.option_level == ksttool.OPTION_LEVEL_LIGHT && node2.option_level == ksttool.OPTION_LEVEL_LIGHT) {
      if (node1.collider_type == ksttool.RECTANGLE_COLLIDER && node2.collider_type == ksttool.RECTANGLE_COLLIDER) {
         var r1 = ksttool.getNodeSize(node1).as_rectangle;
         var r2 = ksttool.getNodeSize(node2).as_rectangle;
         return !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y);
      }
   }

   var collided = false;
   var line1 = ksttool.get_polygon_line_path(node1);
   var line2 = ksttool.get_polygon_line_path(node2);
   for (var i = 0; i < line1.length && !collided; i++) {
      for (var j = 0; j < line2.length && !collided; j++) {
         collided = ksttool.check_intersection_line_line(line1[i], line2[j]); // 폴리폴리함수는 일단 사용되지 않는다.
      }
   }

   // 상대측 노드가 완벽히 쏙 들어온 경우에 대한 케이스 처리
   if (ksttool.ACTIVE_INSIDE_COLLISION) {
      if (!collided) {
         for (var i = 0; i < line1.length && !collided; i++) {
            collided = ksttool.isPointIsInsideNode(node2, line1[i].first, line2);
         }
      }
      if (!collided) {
         for (var i = 0; i < line2.length && !collided; i++) {
            collided = ksttool.isPointIsInsideNode(node1, line2[i].first, line1);
         }
      }
   }
   return collided;
};
ksttool.change_rect_type1_to_type2 = function (type1) {
   // okk
   return ksttool.make_rect_cover_things([type1], false, 2);
};
ksttool.change_rect_type2_to_type1 = function (type2) {
   // okk
   var rtn_obj = [
      { first: { x: type2.left, y: type2.bottom } },
      { first: { x: type2.left, y: type2.top } },
      { first: { x: type2.right, y: type2.top } },
      { first: { x: type2.right, y: type2.bottom } }
   ];
   rtn_obj[0].second = rtn_obj[1].first;
   rtn_obj[1].second = rtn_obj[2].first;
   rtn_obj[2].second = rtn_obj[3].first;
   rtn_obj[3].second = rtn_obj[0].first;
   return rtn_obj;
};
ksttool.make_rect_cover_things = function (yoso, draw, rtype) {
   // okk
   var x_min = null;
   var x_max = null;
   var y_min = null;
   var y_max = null;
   yoso.forEach(item => {
      if (item.r !== undefined) {
         if (draw) {
            $cc.gen_simple_dot(item, item.r * 2, cc.color(255, 155, 55, 255));
         }
         item = [
            {
               first: {
                  x: (item.x - item.r),
                  y: (item.y - item.r)
               }
            },
            {
               first: {
                  x: (item.x - item.r),
                  y: (item.y + item.r)
               }
            },
            {
               first: {
                  x: (item.x + item.r),
                  y: (item.y + item.r)
               }
            },
            {
               first: {
                  x: (item.x + item.r),
                  y: (item.y - item.r)
               }
            }
         ];
      } else {
         if (draw) {
            item.forEach(line => {
               $cc.gen_simple_line(line).setAdvColor(cc.color(255, 255, 255, 255));
            });
         }
      }
      item.forEach(line => {
         if (x_min === null) { x_min = line.first.x; }
         if (x_min > line.first.x) { x_min = line.first.x; }
         if (x_max === null) { x_max = line.first.x; }
         if (x_max < line.first.x) { x_max = line.first.x; }
         if (y_min === null) { y_min = line.first.y; }
         if (y_min > line.first.y) { y_min = line.first.y; }
         if (y_max === null) { y_max = line.first.y; }
         if (y_max < line.first.y) { y_max = line.first.y; }
      });
   });
   var rtn_obj = null;
   if (rtype === 1) {
      rtn_obj = [
         { first: { x: x_min, y: y_min } },
         { first: { x: x_min, y: y_max } },
         { first: { x: x_max, y: y_max } },
         { first: { x: x_max, y: y_min } },
      ];
      rtn_obj[0].second = rtn_obj[1].first;
      rtn_obj[1].second = rtn_obj[2].first;
      rtn_obj[2].second = rtn_obj[3].first;
      rtn_obj[3].second = rtn_obj[0].first;
   } else {
      rtn_obj = {
         left: x_min,
         top: y_max,
         right: x_max,
         bottom: y_min
      };
   }
   return rtn_obj;
};
ksttool.check_collision = function (check_collider, collider_node) {
   //ofc.no
   var collided = false;
   var flow_ = 0;
   if (!collided && check_collider.collider_type == ksttool.CIRCLE_COLLIDER && collider_node.collider_type == ksttool.CIRCLE_COLLIDER) {
      flow_ = 1;
      collided = ksttool.check_collision_circle_circle(collider_node, check_collider);
   }
   if (!collided && check_collider.collider_type == ksttool.CIRCLE_COLLIDER && collider_node.collider_type == ksttool.RECTANGLE_COLLIDER) {
      flow_ = 2;
      collided = ksttool.check_collision_polygon_circle(collider_node, check_collider);
   }
   if (!collided && check_collider.collider_type == ksttool.CIRCLE_COLLIDER && collider_node.collider_type == ksttool.POLYGON_COLLIDER) {
      flow_ = 3;
      collided = ksttool.check_collision_polygon_circle(collider_node, check_collider);
   }
   if (!collided && check_collider.collider_type == ksttool.RECTANGLE_COLLIDER && collider_node.collider_type == ksttool.CIRCLE_COLLIDER) {
      flow_ = 4;
      collided = ksttool.check_collision_polygon_circle(check_collider, collider_node);
   }
   if (!collided && check_collider.collider_type == ksttool.RECTANGLE_COLLIDER && collider_node.collider_type == ksttool.RECTANGLE_COLLIDER) {
      flow_ = 5;
      collided = ksttool.check_collision_polygon_polygon(check_collider, collider_node);
   }
   if (!collided && check_collider.collider_type == ksttool.RECTANGLE_COLLIDER && collider_node.collider_type == ksttool.POLYGON_COLLIDER) {
      flow_ = 6;
      collided = ksttool.check_collision_polygon_polygon(collider_node, check_collider);
   }
   if (!collided && check_collider.collider_type == ksttool.POLYGON_COLLIDER && collider_node.collider_type == ksttool.CIRCLE_COLLIDER) {
      flow_ = 7;
      collided = ksttool.check_collision_polygon_circle(check_collider, collider_node);
   }
   if (!collided && check_collider.collider_type == ksttool.POLYGON_COLLIDER && collider_node.collider_type == ksttool.RECTANGLE_COLLIDER) {
      flow_ = 8;
      collided = ksttool.check_collision_polygon_polygon(collider_node, check_collider);
   }
   if (!collided && check_collider.collider_type == ksttool.POLYGON_COLLIDER && collider_node.collider_type == ksttool.POLYGON_COLLIDER) {
      flow_ = 9;
      collided = ksttool.check_collision_polygon_polygon(collider_node, check_collider);
   }
   return collided;
};











//maaa
// return ksttool.check_if_two_circle_are_overlapped_with_their_center_coordinate_and_radius(circle1, circle2);

ksttool.math.get_coordinate_of_circle_stick_circle = function (requst_data) {
   // okk
   /*
      진행하던 원이 원에 닿거나 꽂혔을때, 진행하다가 맞 닿았을 원의 좌표값을 내어준다.
      (실제로 내어줄 좌표는 원이 서로 닿지 않을 위치이다. check_if_two_circle_are_overlapped_with_their_center_coordinate_and_radius 로 false 판정 나는 위치다.)
      requst_data 인자값은 다음과 같다
      var requst_data = {
         collide_circle: { r: 20, x: 100, y: 400 }, // 충돌체가될 동그라미
         moving_circle: { r: 10 }, // 이동하다가 갓다가 박을 동그라미
         position_before: { x: 97.7288, y: 100 }, // 무빙서클의 위치정보 / 원의 이전 프레임 위치. == 진행시작점
         position_current: { x: 100, y: 121 }, // 무빙서클의 위치정보 / 원의 현재 프레임 위치
      };
   */

   //ok
   var virtual_circle = {
      r: (requst_data.collide_circle.r + requst_data.moving_circle.r),
      x: requst_data.collide_circle.x,
      y: requst_data.collide_circle.y
   };

   //ok
   var circle_cdls = {
      x: requst_data.position_before.x,
      y: requst_data.position_before.y
   }; // 원의 이전 프레임 위치. == 진행시작점

   //ok
   var circle_current_pos = {
      x: requst_data.position_current.x,
      y: requst_data.position_current.y
   }; // 원의 현재 프레임 위치

   var angle__forward = ksttool.math.get_angle_in_radian_between_two_points(circle_cdls, circle_current_pos);
   var angle__reverse = ksttool.math.get_angle_in_radian_between_two_points(circle_current_pos, circle_cdls);

   var cdl_line = {
      first: circle_cdls,
      second: ksttool.math.get_coordinate_distance_away_from_center_with_radian(ksttool.math.INFINITY, circle_cdls, angle__forward)
   }; // 진행 선

   // 
   var place_to_be = ksttool.check_intersection_line_circle(cdl_line, virtual_circle);

   var rnt_ = {};
   if (place_to_be.length < 2) {

      place_to_be = ksttool.check_intersection_line_circle({
         first: circle_cdls,
         second: ksttool.math.get_coordinate_distance_away_from_center_with_radian(ksttool.math.INFINITY, circle_cdls, angle__reverse)
      }, virtual_circle);
   }

   var place_list = [];
   for (var i in place_to_be) {
      if (place_to_be[i]) {
         place_list.push({
            coordinate: place_to_be[i]
         });
      }
   }
   place_list = ksttool.math.sort_list_by_distance(place_list, circle_cdls);
   if (place_list.length > 0) {
      place_to_be = place_list[0].coordinate;
      place_to_be = ksttool.math.get_coordinate_distance_away_from_center_with_radian(
         virtual_circle.r,
         virtual_circle,
         ksttool.math.get_angle_in_radian_between_two_points(virtual_circle, place_to_be));
      place_to_be.r = requst_data.moving_circle.r;

      var cnt = 0;
      while (ksttool.check_if_two_circle_are_overlapped_with_their_center_coordinate_and_radius(requst_data.collide_circle, place_to_be)) {
         place_to_be = ksttool.math.get_coordinate_distance_away_from_center_with_radian(ksttool.math.EPSILON, place_to_be, angle__reverse);
         place_to_be.r = requst_data.moving_circle.r;
         cnt++;
      }
   }
   var rnt_ = {
      place_to_be: null,
      next_angle: null,
      error: ''
   };
   if (false && ksttool.math.get_distance_between_two_point(cdl_line.first, cdl_line.second) - ksttool.math.get_distance_between_two_point(place_to_be, cdl_line.second) < 0) {
      rnt_.error = '선정된 위치가 시작위치보다 더 뒤다 - 충분히 타당하다. 그럴 수 있다.';
      if (true) {
         place_to_be = null;
      }
   }
   if (place_to_be) {
      rnt_.place_to_be = place_to_be;
      rnt_.next_angle = ksttool.math.calculate_next_angle_of_moving_circle_collided_with_other_circle(place_to_be, virtual_circle, cdl_line.first, cdl_line.second);
   }
   return rnt_;
};
ksttool.is_two_points_same = function (p1, p2) {
   /*
   두 점이 같은지 확인한다
    */
   if (!p1 || !p2) {
      return false;
   }
   return p1.x === p2.x && p1.y === p2.y;
};
ksttool.math.check_collision_plp_circle = function (plp, circle) {
   // okk
   /*
   circle 이 plp 와 닿았는가 체크.
    */
   var inters = false;
   for (var i = 0; !inters && i < plp.length; i++) {
      if (ksttool.check_intersection_line_circle(plp[i], circle).length > 0) {
         inters = true;
      }
   }
   if (!inters) {
      inters = ksttool.checkPointIsInsidePolygon(plp, circle);
   }
   return inters;
};
//nwork
ksttool.math.calculate_next_angle_of_moving_circle_collided_with_other_circle = function (moving_circle, coll_circle, before, current) {
   // okk
   /*
   움직이는 공1이 고정된 공2로 날아가 부딛혔을때, 다시 튕겨나갈 각도를 계산해준다.
   공1과 공2는 부딛힌 상태이므로 붇어있다고 보면 된다
   moving_circle: {x:1, y:4} 형태의 좌표이고 이것은 공1의 좌표이다.
   coll_circle:   {x:1, y:4} 형태의 좌표이고 이것은 공2의 좌표이다.
   before: 공1의 이동해오기 전의 위치이다.
   current: 공1의 이동해온 후의 위치이다.
    */
   var virtual_wall = ksttool.math.get_angle_in_radian_between_two_points(moving_circle, coll_circle) + (Math.PI / 2);
   return ksttool.math.calculate_next_angle_of_moving_circle_collided_with_other_line({
      first: ksttool.math.get_coordinate_distance_away_from_center_with_radian(1, coll_circle, virtual_wall),
      second: coll_circle
   }, before, current);
};
ksttool.math.calculate_next_angle_of_moving_circle_collided_with_other_line = function (line, before, current) {
   // okk
   /*
   움직이는 공이 고정된 line로 날아가 부딛혔을때, 다시 튕겨나갈 각도를 계산해준다.
   공과 line는 부딛힌 상태이므로 붇어있다고 보면 된다
   line: {first:{x:1, y:4}, second:{x:1, y:4}} 형태의 좌표이고 이것은 line의 좌표이다.
   before: 공의 이동해오기 전의 위치이다.
   current: 공의 이동해온 후의 위치이다.
    */
   return ksttool.math.calc_angle(
      line.first,
      line.second,
      ksttool.math.conv_degree_for_human(ksttool.math.convert_radian_to_degrees(ksttool.math.get_angle_in_radian_between_two_points(before, current)))
   );
};
ksttool.math.make_square_coordinate_with_circle_direction = function (requst_data) {
   // okk
   var move_distance = ksttool.math.get_distance_between_two_point(requst_data.position_before, requst_data.position_current);
   var square = [];
   var start_point_of_square = ksttool.math.get_coordinate_distance_away_from_center_with_radian((requst_data.circle_info.r / 2) * 2, requst_data.position_before, ksttool.math.get_angle_in_radian_between_two_points(requst_data.position_before, requst_data.position_current) + (Math.PI / 2));
   square.push(start_point_of_square);
   var second_point_of_square = ksttool.math.get_coordinate_distance_away_from_center_with_radian(move_distance, start_point_of_square, ksttool.math.get_angle_in_radian_between_two_points(requst_data.position_before, requst_data.position_current));
   square.push(second_point_of_square);
   var third_point_of_square = ksttool.math.get_coordinate_distance_away_from_center_with_radian(requst_data.circle_info.r * 2, second_point_of_square, ksttool.math.get_angle_in_radian_between_two_points(requst_data.position_before, requst_data.position_current) + (-(Math.PI / 2)));
   square.push(third_point_of_square);
   var fourth_point_of_square = ksttool.math.get_coordinate_distance_away_from_center_with_radian((requst_data.circle_info.r / 2) * 2, requst_data.position_before, ksttool.math.get_angle_in_radian_between_two_points(requst_data.position_before, requst_data.position_current) + (-(Math.PI / 2)));
   square.push(fourth_point_of_square);
   square = ksttool.points_to_polypath(square);
   return square;
};
ksttool.math.get_coordinate_distance_away_from_center_with_radian = function (distance, center_coordinate, angle) {
   // okk
   /*
      지정한 좌표로부터 지정한 거리만큼 지정한 각도로 떨어져있는 지점의 좌표를 반환한다
    */
   angle += Math.PI;
   var ress = {
      x: center_coordinate.x + Math.cos(angle) * distance,
      y: center_coordinate.y + Math.sin(angle) * distance
   };
   return ress;
};
ksttool.check_is_point_on_rect = function (point, rect) {
   // okk
   /*
      point(점)이 rect(사각형)을 이루는 네 선상에 존재할때 true 를 낸다.
      예를 들어 사각형이 {top:10, bottom:0, left:0, right:10} 일때
      점이 {x:0, y:11} 이면 false
      점이 {x:0, y:10} 이면 true
      점이 {x:0, y:5} 이면 true
      이다.
    */
   if (point.y == rect.top || point.y == rect.bottom) {
      if (rect.left <= point.x && rect.right >= point.x) {
         return true;
      }
   }
   if (point.x == rect.left || point.x == rect.right) {
      if (rect.bottom <= point.y && rect.top >= point.y) {
         return true;
      }
   }
   return false;
};
ksttool.check_line_is_stick_through_rect = function (line, rect) {
   // okk
   /*
      설명이 어려우므로 예로 대체.
      예를 들어 사각형이 {top:10, bottom:0, left:0, right:10} 일때
      시작점이 {x:-10, y:0} 이고 끝점이 {x:-5, y:0} 이면 false
      시작점이 {x:-10, y:0} 이고 끝점이 {x:0, y:0} 이면 true
      시작점이 {x:-10, y:0} 이고 끝점이 {x:1, y:0} 이면 true
      시작점이 {x:0, y:0} 이고 끝점이 {x:1, y:0} 이면 false
    */
   let first = line.first;
   let second = line.second;
   for (let i = 0; i < 2; i++) {
      //----------
      if (first.y == rect.top && second.y == rect.top) {
         if (first.x < rect.left && second.x >= rect.left) {
            return true;
         }
      }
      if (first.y == rect.bottom && second.y == rect.bottom) {
         if (first.x < rect.left && second.x >= rect.left) {
            return true;
         }
      }
      if (first.y == rect.top && second.y == rect.top) {
         if (first.x > rect.right && second.x <= rect.right) {
            return true;
         }
      }
      if (first.y == rect.bottom && second.y == rect.bottom) {
         if (first.x > rect.right && second.x <= rect.right) {
            return true;
         }
      }
      //----------
      if (first.x == rect.left && second.x == rect.left) {
         if (first.y > rect.top && second.y <= rect.top) {
            return true;
         }
      }
      if (first.x == rect.right && second.x == rect.right) {
         if (first.y > rect.top && second.y <= rect.top) {
            return true;
         }
      }
      if (first.x == rect.left && second.x == rect.left) {
         if (first.y < rect.bottom && second.y >= rect.bottom) {
            return true;
         }
      }
      if (first.x == rect.right && second.x == rect.right) {
         if (first.y < rect.bottom && second.y >= rect.bottom) {
            return true;
         }
      }
      //==============
      let tmp = second;
      second = first;
      first = tmp;
   }
   return false;
}
ksttool.check_intersection_line_rect = function (line, rect) {
   // okk
   /*
      선 line 이 사각형 rect 을 이루는 네개의 선중 하나와 닿았거나
      선을 이루는 두 점중 하나라도 사각형 안에 들어와있거나
      하다면 true 반환.
   */
   if (!(rect.left > line.first.x || rect.right < line.first.x || rect.top < line.first.y || rect.bottom > line.first.y) ||
      !(rect.left > line.second.x || rect.right < line.second.x || rect.top < line.second.y || rect.bottom > line.second.y)) {
      return true;
   }

   if (ksttool.check_is_point_on_rect(line.first, rect) || ksttool.check_is_point_on_rect(line.second, rect)) {
      return true;
   }

   let list = ksttool.change_rect_type2_to_type1(rect);
   for (let i = 0, len = list.length; i < len; i++) {
      if (ksttool.check_intersection_line_line(list[i], line, true)) { // 합격! 테스트함.
         return true;
      }
   }

   if (ksttool.check_line_is_stick_through_rect(line, rect)) {
      return true;
   }
   return false;
};
ksttool.math.get_coordinate_of_circle_stick_line = function (requst_data) {
   // okk
   /*
   진행하던 원이 선에 닿거나 꽂혔을때, 진행하다가 맞 닿았을 원의 좌표값을 내어준다.
   실제로 내어줄 좌표는 원과 선이 서로 닿지 않을 위치이다. check_intersection_line_circle 로 체크했을때 비어있는 배열이 나온다는 소리다.
   requst_data 인자값은 다음과 같다
   var requst_data = {
      real_height: 4565, // 진짜현재화면높이픽셀
      virtual_height: 1920, // 가상의화면높이픽셀
      circle_radius: 25, // 원의 반지름
      position_before: {x: 0, y: 55 }, // 원의 이전 프레임 위치. == 진행시작점
      position_current: {x: 5, y: 57 }, // 원의 현재 프레임 위치
      collide_line: { first: { x: 110, y: 110 }, second: { x: 210, y: 500 } } // 충돌벽
   };
   */
   var circle_cr = requst_data.circle_radius; // 원의 반지름
   var circle_cdls = { x: requst_data.position_before.x, y: requst_data.position_before.y }; // 원의 이전 프레임 위치. == 진행시작점
   var circle_current_pos = { x: requst_data.position_current.x, y: requst_data.position_current.y }; // 원의 현재 프레임 위치
   var infinit = ksttool.math.INFINITY;
   var dangle = ksttool.math.get_angle_in_radian_between_two_points(circle_cdls, circle_current_pos);
   var circle_cdle = ksttool.math.get_coordinate_distance_away_from_center_with_radian(infinit, circle_cdls, dangle);
   var circle_xdle = ksttool.math.get_coordinate_distance_away_from_center_with_radian(-infinit, circle_cdls, dangle);
   var cdl_line = { name: 'cdl', first: circle_cdls, second: circle_cdle }; // 진행 선
   var cdl_line_long = {
      first: circle_xdle,
      second: circle_cdle
   }; // 진행 선
   var center_line = {
      name: 'l',
      first: {
         x: requst_data.collide_line.first.x,
         y: requst_data.collide_line.first.y
      },
      second: {
         x: requst_data.collide_line.second.x,
         y: requst_data.collide_line.second.y
      }
   }; // 충돌벽
   var center_line_lp1 = center_line.first; // 충돌벽 끝점 1
   var center_line_lp2 = center_line.second; // 충돌벽 끝점 2
   var length_of_center_line = ksttool.math.get_distance_between_two_point(center_line_lp1, center_line_lp2); // 충돌벽 길이
   var angle_of_center_line = ksttool.math.get_angle_in_radian_between_two_points(center_line_lp1, center_line_lp2); // 충돌벽 기울기 각도
   var nnn1 = ksttool.math.get_coordinate_distance_away_from_center_with_radian(circle_cr, center_line_lp1, angle_of_center_line + (Math.PI / 2));
   var nnn1_ = ksttool.math.get_coordinate_distance_away_from_center_with_radian(length_of_center_line, nnn1, angle_of_center_line);
   var line_left = {
      name: 'll',
      first: nnn1,
      second: nnn1_
   };
   var nnn2 = ksttool.math.get_coordinate_distance_away_from_center_with_radian(circle_cr, center_line_lp1, angle_of_center_line + (-(Math.PI / 2)));
   var nnn2_ = ksttool.math.get_coordinate_distance_away_from_center_with_radian(length_of_center_line, nnn2, angle_of_center_line);
   var line_right = {
      name: 'lr',
      first: nnn2,
      second: nnn2_
   };
   var line_list = [center_line, line_left, line_right];
   //-------------------------
   let spc; // 초근접
   if (false) {
      let vline = {
         first: ksttool.math.get_coordinate_distance_away_from_center_with_radian(infinit, requst_data.position_before, angle_of_center_line + (ksttool.math.HALF_PI)),
         second: ksttool.math.get_coordinate_distance_away_from_center_with_radian(-infinit, requst_data.position_before, angle_of_center_line + (ksttool.math.HALF_PI))
      };
      var rstv = ksttool.check_intersection_line_line(vline, center_line, true);
      if (rstv) {
         let dahk = ksttool.check_intersection_line_circle(center_line, { x: requst_data.position_before.x, y: requst_data.position_before.y, r: circle_cr });
         var dist = ksttool.math.get_distance_between_two_point(requst_data.position_before, rstv); // 교차점과 비포원중심거리
         let result_from_distance = dist <= circle_cr;
         let result_from_circleit = dahk.length > 0;
         spc = Math.abs(dist - circle_cr) < ksttool.math.EPSILON;
      }
   }
   //-------------------------
   var list_need = [];
   for (var i = 0; i < line_list.length; i++) {
      let rst;
      if (false) {
         rst = ksttool.check_intersection_line_line(cdl_line, line_list[i], true);
      } else {
         rst = ksttool.check_intersection_line_line(cdl_line_long, line_list[i], true);
      }
      if (!rst && spc) {
         rst = ksttool.check_intersection_line_line({
            name: 'cdl', first: ksttool.math.get_coordinate_distance_away_from_center_with_radian(ksttool.math.EPSILON, circle_cdls, -ksttool.math.get_angle_in_radian_between_two_points(circle_cdls, circle_current_pos)),
            second: circle_cdle
         }, line_list[i], true);
      }
      list_need.push({
         coordinate: rst, // ok인듯. 테스트함 합격
         body: line_list[i]
      });
   }
   list_need = ksttool.math.sort_list_by_distance(list_need, circle_cdls);
   var rp_point = null;
   var work_mode = 0;
   var nangle = null;
   if (list_need.length == 0 || (list_need.length > 0 && list_need[0].body.name == 'l') || (list_need.length == 1 && list_need[0].body.name != 'l')) {
      center_line_lp1.r = circle_cr;
      center_line_lp2.r = circle_cr;
      var need_sort = [];
      var cll_ = [center_line_lp1, center_line_lp2];
      cll_.forEach(circle => {
         var coords = ksttool.check_intersection_line_circle(cdl_line, circle);
         coords.forEach(coord => {
            need_sort.push({
               coordinate: coord,
               circle: circle
            });
         });
      });
      need_sort = ksttool.math.sort_list_by_distance(need_sort, circle_cdls);
      if (need_sort.length > 0) {
         rp_point = need_sort[0].coordinate;
      }
      if (rp_point) {
         rp_point.r = circle_cr;
         var coordss = ksttool.check_intersection_line_circle(center_line, rp_point);
         if ((list_need.length > 0 && list_need[0].body.name != 'l') && coordss.length == 2) {
            rp_point = list_need[0].coordinate;
            work_mode = 1;
            rp_point.r = circle_cr;
         }
      }
   }
   else if (list_need.length >= 2 && list_need[1].body.name == 'l') {
      rp_point = list_need[0].coordinate;
      work_mode = 1;
   }
   let bojung_counter = 0;
   if (rp_point) {
      var place_to_be = rp_point;
      place_to_be.r = circle_cr;
      var elsilon_value = ksttool.math.EPSILON;
      var opx = null;
      if (requst_data.virtual_height !== undefined && requst_data.real_height !== undefined) {
         opx = (requst_data.real_height / requst_data.virtual_height);
      } else {
         opx = ($cc.ccph(1) / cocosKst.const.sizeRatio.height);
      }

      if (!work_mode) {
         elsilon_value *= 1000;
      }
      let mode2 = false;
      //================
      // 속체
      // pst('sockche');
      if (false) {
      } else {
         var TSTE = null;//[];
         while (ksttool.check_intersection_line_circle(center_line, place_to_be).length > 0) {
            if (bojung_counter > 10) {
               mode2 = true;
               break;
            } else {
               bojung_counter++;
               if (false) {
                  TSTE.push(elsilon_value);
               }
               place_to_be = ksttool.math.get_coordinate_distance_away_from_center_with_radian(elsilon_value, place_to_be, ksttool.math.get_angle_in_radian_between_two_points(circle_cdle, circle_cdls));
               place_to_be.r = circle_cr; //requst_data.moving_circle.r;
               if (true) {
                  elsilon_value *= 5;
                  if (elsilon_value > opx) {
                     elsilon_value = opx;
                  }
               }
            }
         }
         if (false && TSTE.length >= 0) {
            if (!vs.get('TSTT')) { vs.set('TSTT', {}); }
            if (!vs.get('TSTT')['a' + TSTE.length]) {
               vs.get('TSTT')['a' + TSTE.length] = 0;
            }
            vs.get('TSTT')['a' + TSTE.length]++;
         }
         if (mode2) {
            var moving_distance = ksttool.math.get_distance_between_two_point(requst_data.position_before, requst_data.position_current); // 이동 길이
            var minimm_distance = opx * 100; //$cc.ccpw(0.01);
            if (moving_distance > minimm_distance || moving_distance <= 0) {
               moving_distance = minimm_distance;
            }
            elsilon_value = moving_distance;//$cc.ccpw(0.01);
            var swt = mode2;
            var dah = mode2;
            while (true) {
               if (swt !== dah) {
                  // 첫번째 루프에는 안들어온다
                  swt = dah;
                  elsilon_value /= 2;
               }

               place_to_be = ksttool.math.get_coordinate_distance_away_from_center_with_radian(elsilon_value * ((dah) ? 1 : -1), place_to_be, ksttool.math.get_angle_in_radian_between_two_points(circle_cdle, circle_cdls));
               place_to_be.r = circle_cr; //requst_data.moving_circle.r;
               bojung_counter++;

               dah = ksttool.check_intersection_line_circle(center_line, place_to_be).length > 0;
               if (opx >= elsilon_value && !dah) {
                  break;
               }
            }
         }
      }
      // pet('sockche');
      rp_point = place_to_be;
      rp_point.line_width = circle_cr * 2;
      rp_point.r = circle_cr;
      delete rp_point.line_width;
      if (true) {
         if (work_mode == 1) {
            // 선에 닿은거다.
            nangle = ksttool.math.calculate_next_angle_of_moving_circle_collided_with_other_line(center_line, requst_data.position_before, requst_data.position_current);
         } else {
            // 점에 닿은거다. coll_point 가 닿은 그 점이다.
            var distance1 = ksttool.math.get_distance_between_two_point(rp_point, center_line.first);
            var distance2 = ksttool.math.get_distance_between_two_point(rp_point, center_line.second);
            var coll_point = (distance1 < distance2) ? center_line.first : center_line.second;
            nangle = ksttool.math.calculate_next_angle_of_moving_circle_collided_with_other_circle(rp_point, coll_point, circle_cdls, circle_cdle);
         }
      }
   }
   if (0) { if (!vs.get('perform')) { vs.set('perform', { accm: 0, cnt: 0 }); } vs.get('perform').accm += bojung_counter; vs.get('perform').cnt += 1; }
   //nwork
   return {
      rp_point: rp_point,
      cdl_line: cdl_line,
      center_line: center_line,
      line_left: line_left,
      line_right: line_right,
      next_angle: nangle
   };
};
ksttool.math.sort_list_by_distance = function (list_need, circle_cdls) {
   // okk
   /*
   list_need의 요소들을 circle_cdls 와 가까운 순서대로 정렬시켜준다.
   list_need는 어레이이고 이것의 요소들 마다 coordinate 키를가지고 있는데 이것은 좌표형태이다.
   circle_cdls 의 모습은 {x: 10, y: 33} 이런식의 좌표형태이다.
   list_need 의 샘플은 아래와 같다. corrdinate 는 필수 항목이다.
   [
      {
         "coordinate": {
            "x": 159.15254237288136,
            "y": 301.6949152542373
         },
         "body": {
            "name": "l",
            "first": {
               "x": 110,
               "y": 110,
               "line_width": 3.541666666666667
            },
            "second": {
               "x": 210,
               "y": 500
            }
         }
      },
      {
         "coordinate": {
            "x": 142.0925236108497,
            "y": 335.8149527783006
         },
         "body": {
            "name": "ll",
            "first": {
               "x": 85.78340334889887,
               "y": 116.2093837566926
            },
            "second": {
               "x": 185.78340334889896,
               "y": 506.20938375669255
            }
         }
      },
      {
         "coordinate": {
            "x": 176.21256113491307,
            "y": 267.5748777301738
         },
         "body": {
            "name": "lr",
            "first": {
               "x": 134.21659665110113,
               "y": 103.7906162433074
            },
            "second": {
               "x": 234.2165966511012,
               "y": 493.79061624330734
            }
         }
      }
   ]
    */
   var sorted_list = [];
   var idx_list = [];
   for (var i = 0; i < list_need.length; i++) {
      var min_distance = null;
      var mino = null;
      var idx = -1;
      for (var line in list_need) {
         var inter_point = list_need[line].coordinate;
         if (inter_point) {
            var len = ksttool.math.get_distance_between_two_point(circle_cdls, inter_point);
            if (mino == null || (min_distance !== null && min_distance > len)) {
               if (!idx_list.includes(line)) {
                  mino = list_need[line];
                  min_distance = len;
                  idx = line;
               }
            }
         }
      }
      if (mino) {
         idx_list.push(idx);
         sorted_list.push(mino);
      }
   }
   return sorted_list;
};
ksttool.get_aite_angle_direction = function (방향각도2, 방향각도1, degree) {
   // okk
   if (false) {
      ksttool.get_aite_angle_direction(ksttool.math.convert_degrees_to_radian(170), ksttool.math.convert_degrees_to_radian(160));
      ksttool.get_aite_angle_direction(ksttool.math.convert_degrees_to_radian(-90), ksttool.math.convert_degrees_to_radian(0));
      ksttool.get_aite_angle_direction(ksttool.math.convert_degrees_to_radian(180), ksttool.math.convert_degrees_to_radian(-90));
      ksttool.get_aite_angle_direction(ksttool.math.convert_degrees_to_radian(170), ksttool.math.convert_degrees_to_radian(160));
      ksttool.get_aite_angle_direction(ksttool.math.convert_degrees_to_radian(170), ksttool.math.convert_degrees_to_radian(160));
   }
   if (degree) {
      방향각도1 = ksttool.math.convert_degrees_to_radian(방향각도1);
      방향각도2 = ksttool.math.convert_degrees_to_radian(방향각도2);
   }
   var 방향각차 = ksttool.calc_difference_between_two_radian(방향각도1, 방향각도2);
   // console.log('함수안', '방향각도1', ksttool.math.convert_radian_to_degrees(방향각도1));
   // console.log('함수안', '방향각도2', ksttool.math.convert_radian_to_degrees(방향각도2));
   // console.log('함수안', '방향각차', ksttool.math.convert_radian_to_degrees(방향각차));
   // console.log('방향각차', 방향각차);
   let 비1 = 방향각도2 + 방향각차;
   let 비2 = 방향각도2 - 방향각차;
   // console.log('함수안', '계산1', ksttool.math.convert_radian_to_degrees(비1), ksttool.math.convert_radian_to_degrees(비2));
   if (비1 > Math.PI) {
      비1 -= Math.PI * 2;
   }
   if (비2 > Math.PI) {
      비2 -= Math.PI * 2;
   }

   if (비1 <= -Math.PI) {
      비1 += Math.PI * 2;
   }
   if (비2 <= -Math.PI) {
      비2 += Math.PI * 2;
   }

   // console.log('함수안', '계산2', ksttool.math.convert_radian_to_degrees(비1), ksttool.math.convert_radian_to_degrees(비2));
   let k1 = ksttool.get_distance_between_two_number(방향각도1, 비1);
   let k2 = ksttool.get_distance_between_two_number(방향각도1, 비2);
   if (k1 >= Math.PI * 2) {
      k1 -= Math.PI * 2;
   }
   if (k2 >= Math.PI * 2) {
      k2 -= Math.PI * 2;
   }
   // console.log('차1', ksttool.math.convert_radian_to_degrees(방향각도1), ksttool.math.convert_radian_to_degrees(비1), ksttool.math.convert_radian_to_degrees(k1));
   // console.log('차2', ksttool.math.convert_radian_to_degrees(방향각도1), ksttool.math.convert_radian_to_degrees(비2), ksttool.math.convert_radian_to_degrees(k2));

   if (k1 < k2) {
      return true;
   } else {
      return false;
   }
};

ksttool.get_distance_between_two_number = function (a, b) {
   // okk
   if (a > b) {
      return a - b;
   } else {
      return b - a;
   }
};

ksttool.calc_mid_radian_between_two_line = function (l1, l2, rat) {
   // okk
   // 두선의 중간각도를 구해줌
   var t1 = (ksttool.math.get_angle_in_radian_between_two_points(l1.first, l1.second));
   var t2 = (ksttool.math.get_angle_in_radian_between_two_points(l2.second, l2.first));
   if (rat === undefined) {
      rat = 0.5;
   }
   return ksttool.calc_difference_between_two_radian(t1, t2) * rat;
};
ksttool.is_vv_in_radian = function (angle, vv, in_rad) {
   // okk
   // 설명: http://cfile1.uf.tistory.com/image/9929323C5BF3ABB43175CD
   if (in_rad === undefined) {
      // in_rad 인자가 주어지지 않으면 기본적으로 90도 이내인지를 판별한다.
      in_rad = Math.PI / 2;
   }
   return ksttool.calc_difference_between_two_radian(angle, vv) < in_rad;
}
ksttool.calc_difference_between_two_radian = function (a, b) {
   // okk
   // 두 각도의 차이를 구해준다
   // 두 각도의 차이는 180도를 넘을 수 없다.
   var dd = a - b;
   if (dd < 0) { dd *= -1; }
   return dd > Math.PI ? (Math.PI * 2) - dd : dd;
};
ksttool.make_vector_with_two_point_and_a_vector = function (line_without_direction_p1, line_without_direction_p2, vector) {
   // okk
   var v1 = (ksttool.math.get_angle_in_radian_between_two_points(line_without_direction_p1, line_without_direction_p2));
   var v2 = v1 - Math.PI; //(ksttool.math.get_angle_in_radian_between_two_points(line_without_direction_p2, line_without_direction_p1));
   // console.log(v1, v2);
   var t1 = (ksttool.math.get_angle_in_radian_between_two_points(vector.first, vector.second));
   var fes = false;
   if (ksttool.is_vv_in_radian(v1, t1)) {
      fes = true;
   }
   if (ksttool.is_vv_in_radian(v2, t1)) {
      fes = true;
      [line_without_direction_p1, line_without_direction_p2] = [line_without_direction_p2, line_without_direction_p1];
   }
   if (fes) {
      return { first: line_without_direction_p1, second: line_without_direction_p2 };
   }
   return null;
}
ksttool.make_collision_area = function (line1, line2) {
   // okk
   let triangles = null;
   let 교차점 = ksttool.check_intersection_line_line(line1, line2, true);
   if (교차점) {
      triangles = [
         {
            direction: (ksttool.math.get_angle_in_radian_between_two_points(line1.first, line2.first)),
            plp: [
               { first: 교차점, second: line1.first },
               { first: line1.first, second: line2.first },
               { first: line2.first, second: 교차점 }
            ],
            future: { first: line2.first, second: 교차점 }
         }, {
            direction: (ksttool.math.get_angle_in_radian_between_two_points(line1.second, line2.second)),
            plp: [
               { first: 교차점, second: line1.second },
               { first: line1.second, second: line2.second },
               { first: line2.second, second: 교차점 }
            ],
            future: { first: line2.second, second: 교차점 }
         }
      ];
   } else {
      let 방향선1 = { first: line1.first, second: line2.first };
      let 방향선2 = { first: line1.second, second: line2.second };
      // $cc.gen_simple_line(방향선1).setAdvColor(cc.color(255, 0, 255, 255));
      // $cc.gen_simple_line(방향선2).setAdvColor(cc.color(100, 255, 155, 255));
      let 결 = ksttool.calc_angle_average_of_two_lines(방향선1, 방향선2);
      triangles = [
         {
            direction: 결,
            plp: [
               { first: line1.first, second: line1.second },
               { first: line1.second, second: line2.second },
               { first: line2.second, second: line2.first },
               { first: line2.first, second: line1.first }
            ],
            future: line2
         }
      ];
   }
   return triangles;
};
ksttool.check_area_and_ballnode = function (ball_node, de, fs) {
   // okk
   let bl = ball_node;//.getCircleInfo();
   let ok = false;
   let coll_wall = de.future;
   let cw_list = fs ? [] : null;
   if (fs) { // AD이거랑관계있다
      ok = true;
   } else {
      ok = ksttool.check_intersection_line_circle(de.plp[2], bl).length > 0;
   }
   if (!ok) {
      if (ksttool.checkPointIsInsidePolygon(de.plp, bl)) {
         ok = true;
      }
   }
   if (ok) {
      let fje = {
         circle_radius: bl.r, // 원의 반지름
         position_before: ksttool.math.get_coordinate_distance_away_from_center_with_radian(1000000, bl, de.direction), // 원의 이전 프레임 위치. == 진행시작점
         position_current: bl, // 원의 현재 프레임 위치
         collide_line: coll_wall // 충돌벽
      };
      if (!fs) {
         var result_data = ksttool.math.get_coordinate_of_circle_stick_line(fje);
         if (result_data.rp_point) {
            // console.log(result_data.rp_point);
            return result_data.rp_point;
         }
      } else {
         let res = [];
         de.plp.forEach(line => {
            fje.collide_line = line;
            var result_data = ksttool.math.get_coordinate_of_circle_stick_line(fje);
            if (result_data.rp_point) {
               res[res.length] = {
                  coordinate: result_data.rp_point
               };
            }
         });
         if (res.length > 0) {
            let coor = ksttool.math.sort_list_by_distance(res, fje.position_before)[0].coordinate;
            return coor;
         } else {
            return null;
         }
      }
   }
};
ksttool.calc_angle_average_of_two_lines = function (방향선1, 방향선2) {
   // okk
   //다이렉션앵글
   var 방향각도1 = (ksttool.math.get_angle_in_radian_between_two_points(방향선1.first, 방향선1.second));
   var 방향각도2 = (ksttool.math.get_angle_in_radian_between_two_points(방향선2.first, 방향선2.second));
   var 방향각차 = ksttool.calc_difference_between_two_radian(방향각도1, 방향각도2);

   //다이렉션길이
   var 방향길이1 = ksttool.math.get_distance_between_two_point(방향선1.first, 방향선1.second);
   var 방향길이2 = ksttool.math.get_distance_between_two_point(방향선2.first, 방향선2.second);
   var 벡터비율 = 0;
   if (방향길이1 > 방향길이2) { 벡터비율 = 방향길이2 / (방향길이1 + 방향길이2); } else { 벡터비율 = 방향길이1 / (방향길이1 + 방향길이2); }
   let 결 = 0;
   if (방향길이1 < 방향길이2) {
      let dir = ksttool.get_aite_angle_direction(방향각도2, 방향각도1);
      if (dir) {
         결 = 방향각도2 + 벡터비율 * 방향각차;
      } else {
         결 = 방향각도2 - 벡터비율 * 방향각차;
      }
   } else {
      let dir = ksttool.get_aite_angle_direction(방향각도1, 방향각도2);
      if (ksttool.get_aite_angle_direction(방향각도1, 방향각도2)) {
         결 = 방향각도1 + 벡터비율 * 방향각차;
      } else {
         결 = 방향각도1 - 벡터비율 * 방향각차;
      }
   }
   if (결 > Math.PI) {
      결 -= Math.PI * 2;
   }
   return 결;
};




ksttool.checkRayCastedCollided = function (circle_current, intersected) {
   //ofc
   var inters = false;
   var in_len = intersected.length;
   for (var i = 0; !inters && i < in_len; i++) {
      var block = null;
      var wall_boundary = null;
      var circle_kind = intersected[i] instanceof cc.Node;
      var body = intersected[i];
      if (circle_kind) {
         block = body;
         if (!inters) {
            var cin = block.getCircleInfo();
            if (ksttool.check_if_two_circle_are_overlapped_with_their_center_coordinate_and_radius(cin, circle_current)) {
               inters = true;
            }
         }
      } else {
         wall_boundary = body;
         if (!inters) {
            var res = ksttool.check_intersection_line_circle(wall_boundary, circle_current);
            inters = res.length > 0;
         }
      }
   }
   return inters;
};
ksttool.bouncing_path_of_ball = function (speed, path_limit, angle_value, current_circle_info, gsection, moving_things, submode, height_info) {
   // okk (submode 를 false 로 하고 height_info 값을 줄 경우)
   //ofc.yes (submode 를 !false 로 하고 height_info 를 비워둘경우)
   if (false) {
      let path_limit = 30;
      let speed = 5.1;
      let angle_value = 25;
      let current_circle_info = flying_ball.getCircleInfo();
      let gsection = cocosKst.g_section;
   }
   let listd = [];
   listd[listd.length] = {
      body: null,
      coordinate: current_circle_info,
      next_angle_info: angle_value
   };
   while (true) {
      let picked = ksttool.calculate_coordinate(current_circle_info, angle_value, speed, gsection, moving_things, submode, height_info);
      if (picked.body && angle_value !== picked.next_angle_info) { //  || cntv === 0
         listd[listd.length] = picked;
      }
      current_circle_info = picked.coordinate;
      angle_value = picked.next_angle_info;
      if (listd.length > path_limit) {
         break;
      }
   }
   return listd;
};
ksttool.check_line_collided = function (out_line, collision_area, circle_current) {
   // okk
   let inters = false;
   for (let i = 0, len = collision_area.length; i < len; i++) {
      if (ksttool.check_intersection_line_line(collision_area[i], out_line, true)) { // ok 라고 봄. (테스트함)
         inters = true;
         break;
      }
   }
   if (!inters) {
      inters = ksttool.check_intersection_line_circle(out_line, circle_current).length > 0;
   }
   return inters;
};
ksttool.calculate_coordinate = function (current_circle_info, angle_value, speed, gsection, moving_things, submode, height_info) {
   // okk (submode 를 false 로 할경우)
   //ofc.yes (submode 를 !false 로 할경우)
   var requst_data = {
      circle_info: { r: current_circle_info.r },
      position_before: current_circle_info,
      position_current: ksttool.math.get_coordinate_distance_away_from_center_with_degree(speed, current_circle_info, angle_value),
   };
   var collision_area = ksttool.math.make_square_coordinate_with_circle_direction(requst_data); // 좀 무거움
   var circle_current = {
      x: requst_data.position_current.x,
      y: requst_data.position_current.y,
      r: requst_data.circle_info.r
   };
   var circle_before = {
      x: requst_data.position_before.x,
      y: requst_data.position_before.y,
      r: requst_data.circle_info.r
   };
   var picked = {
      body: null,
      coordinate: circle_current,
      next_angle_info: angle_value
   };

   // 교차한것을 모으는것이다
   // 모아서 intersected 변수에 넣는다.
   // 하나도 없으면 null 인 상태로 유지된다.
   var intersected = null;

   // 충돌체는 다양한 형태로 두었다.
   if (gsection) {
      // #1 G-SECTION
      // 일단 gsection 이라고 해서 퍼포먼스를 높이기 위해 탐색범위를 줄인것이 있다. 
      // 여기는 주로 충돌체가 움직이지 않을경우 높은 성능을 낼 수 있다.
      let sections = gsection.get_section(ksttool.make_rect_cover_things([circle_current, collision_area], false, 2));
      for (let ia = 0, len = sections.length; ia < len; ia++) {
         sections[ia].line.forEach(out_line => {
            let inters = false;
            for (let i = 0, len = collision_area.length; i < len; i++) {
               if (ksttool.check_intersection_line_line(collision_area[i], out_line, true)) { // ok 라고 봄. (테스트함)
                  inters = true;
                  break;
               }
            }
            if (!inters) {
               inters = ksttool.check_intersection_line_circle(out_line, circle_current).length > 0;
            }
            if (inters) {
               if (intersected === null) {
                  intersected = [];
               }
               intersected[intersected.length] = out_line;
            }
         });
      }
   }
   if (moving_things.length > 0) {
      moving_things.loop(function (item) {
         if (item.body !== undefined) {
            //---
            if (!submode && (item.body instanceof PixiPolygon)) {
               let vector = item.body.is_vector();
               if (!vector) {
                  let adfdd = item.body.getWorldPathInPLPType();
                  let fewdf = adfdd.length;
                  for (let i = 0; i < fewdf; i++) {
                     let out_line = adfdd[i];
                     let inters = ksttool.check_line_collided(out_line, collision_area, circle_current);
                     if (inters) {
                        if (intersected === null) {
                           intersected = [];
                        }
                        out_line.extd = item.body;
                        intersected[intersected.length] = out_line;
                     }
                  }
               } else {
                  let out_line = (item.body.get_vector());
                  let inters = ksttool.check_line_collided(out_line, collision_area, circle_current);
                  if (inters) {
                     if (intersected === null) {
                        intersected = [];
                     }
                     out_line.extd = item.body;
                     intersected[intersected.length] = out_line;
                  }
               }
            }
            //---
            if (submode && (item.body instanceof AdvPolygon)) {
               let vector = item.body.is_vector();
               if (!vector) {
                  let adfdd = item.body.getWorldPathInPLPType();
                  let fewdf = adfdd.length;
                  for (let i = 0; i < fewdf; i++) {
                     let out_line = adfdd[i];
                     let inters = ksttool.check_line_collided(out_line, collision_area, circle_current);
                     if (inters) {
                        if (intersected === null) {
                           intersected = [];
                        }
                        out_line.extd = item.body;
                        intersected[intersected.length] = out_line;
                     }
                  }
               } else {
                  let out_line = (item.body.get_vector());
                  let inters = ksttool.check_line_collided(out_line, collision_area, circle_current);
                  if (inters) {
                     if (intersected === null) {
                        intersected = [];
                     }
                     out_line.extd = item.body;
                     intersected[intersected.length] = out_line;
                  }
               }
            }
            if (submode && (item.body instanceof PolyNode)) {
               let ndd = item.body.getNode();
               let pol = ndd.get_custom_box_attr('polyline');
               if (pol) {
                  item.body.translatePLInWorld(pol).forEach(out_line => {
                     let inters = false;
                     for (let i = 0, len = collision_area.length; i < len; i++) {
                        if (ksttool.check_intersection_line_line(collision_area[i], out_line, true)) { // ok 라고 봄. (테스트함)
                           inters = true;
                           break;
                        }
                     }
                     if (!inters) {
                        inters = ksttool.check_intersection_line_circle(out_line, circle_current).length > 0;
                     }
                     if (inters) {
                        if (intersected === null) {
                           intersected = [];
                        }
                        intersected[intersected.length] = out_line;
                     }
                  });
               }
            }
         }
      });
   }
   if (intersected && intersected.length > 0) {
      var coord_list = [];
      intersected.forEach(collision_candidate => {
         var colliders_coordinate = null;
         var next_angle_info = null;
         var colliders_bodie = null;
         if (submode && (collision_candidate instanceof cc.Node)) {
            var requst_data = {
               collide_circle: collision_candidate.getCircleInfo(), // 충돌체가될 동그라미
               moving_circle: { r: circle_current.r }, // 이동하다가 갓다가 박을 동그라미
               position_before: circle_before, // 원의 이전 프레임 위치. === 진행시작점
               position_current: circle_current, // 원의 현재 프레임 위치
            };
            var result_stick_info = ksttool.math.get_coordinate_of_circle_stick_circle(requst_data);
            if (result_stick_info.place_to_be) {
               if (!ksttool.checkRayCastedCollided(result_stick_info.place_to_be, intersected)) {
                  colliders_coordinate = result_stick_info.place_to_be;
                  next_angle_info = result_stick_info.next_angle;
                  colliders_bodie = collision_candidate;
               }
            }
         } else {
            var requst_data = {
               circle_radius: circle_current.r, // 원의 반지름
               position_before: circle_before, // 원의 이전 프레임 위치. === 진행시작점
               position_current: circle_current, // 원의 현재 프레임 위치
               collide_line: collision_candidate // 충돌벽
            };
            if (height_info) {
               requst_data.real_height = height_info.r;
               requst_data.virtual_height = height_info.v;
            }
            var result_data = ksttool.math.get_coordinate_of_circle_stick_line(requst_data);
            colliders_coordinate = result_data.rp_point;
            next_angle_info = result_data.next_angle;
            colliders_bodie = collision_candidate;
         }
         if (colliders_coordinate !== null) {
            coord_list.push({
               coordinate: colliders_coordinate,
               body: colliders_bodie,
               next_angle_info: next_angle_info
            });
         }
      });
      coord_list = ksttool.math.sort_list_by_distance(coord_list, circle_before);
      if (coord_list.length > 0) {
         picked.body = coord_list[0].body;
         picked.coordinate = coord_list[0].coordinate;
         picked.next_angle_info = coord_list[0].next_angle_info;
         let dist1 = ksttool.math.get_distance_between_two_point(circle_current, circle_before);
         let dist2 = ksttool.math.get_distance_between_two_point(circle_current, picked.coordinate);
         if (dist1 < dist2) {
            picked.coordinate = circle_before;
            picked.next_angle_info = coord_list[0].next_angle_info;
         }
      }
   }
   return picked;
};
ksttool.check_intersection_rect_line = function (rect, line) {
   // okk
   let pointin = ksttool.checkPointIsInsidePolygon(rect, line.second) || ksttool.checkPointIsInsidePolygon(rect, line.first);
   if (!pointin) {
      for (let i = 0, len = rect.length; i < len; i++) {
         if (ksttool.check_intersection_line_line(rect[i], line, true)) {
            pointin = true;
            break;
         }
      }
   }
   return pointin;
};
ksttool.convert_XYX_to_PLP = function (list, clone) {
   // okk
   var rtn = [];
   for (let i = 0, len = list.length - 1; i < len; i++) {
      let first = clone ? { x: list[i].x, y: list[i].y } : list[i];
      let second = clone ? { x: list[i + 1].x, y: list[i + 1].y } : list[i + 1];
      rtn[rtn.length] = {
         first: first,
         second: second
      };
   }
   if (rtn.length > 0) {
      rtn[rtn.length] = {
         first: rtn[rtn.length - 1].second,
         second: rtn[0].first
      };
   }
   return rtn;
};
ksttool.check_type_of_vector_chain = function (list) {
   // okk
   /*
      벡터체인의 타입을 리턴해주는데 요소가 하나도 없으면 0 리턴
      벡터체인 타입이 PLP 면 1, XYX면 2 리턴한다.
   */
   if (list.length) {
      return list[0].first ? ksttool.VECTOR_CHAIN_TYPE_PLP : ksttool.VECTOR_CHAIN_TYPE_XYX;
   }
   return ksttool.VECTOR_CHAIN_TYPE_NONE;
};
ksttool.reset_length_of_vector_from_mid = function (length, vec) {
   let nline = {};
   let rad = ksttool.math.get_angle_in_radian_between_two_points(vec.second, vec.first);
   let center = ksttool.math.get_coordinate_between_two_points(vec.second, vec.first, 0.5);
   nline.first = ksttool.math.get_coordinate_distance_away_from_center_with_radian(-(length), center, rad);
   nline.second = ksttool.math.get_coordinate_distance_away_from_center_with_radian(length, center, rad);
   return nline;
};
ksttool.convert_PLP_to_XYX = function (list, clone, adv) {
   // okk
   let rtn = [];
   for (let i = 0, len = list.length; i < len; i++) {
      let last = i === len - 1;
      if (clone) {
         rtn[rtn.length] = {
            x: list[i].first.x,
            y: list[i].first.y,
         };
         if (last) {
            rtn[rtn.length] = {
               x: list[i].second.x,
               y: list[i].second.y,
            };
         }
      } else {
         rtn[rtn.length] = list[i].first;
         if (last) {
            rtn[rtn.length] = list[i].second;
         }
      }
   }
   if (adv) {
      rtn.splice(rtn.length - 1, 1);
   }
   return rtn;
};
ksttool.divide_polygon = function (pol, glnv) {
   /*
   pol 는 도형이고, glnv 은 pol 을 관통하는 라인이다
   도형을 이루는 선은 서로 교차해서는 안된다.
   도형을 관통하는 라인은 라인의 가장 첫시작점과 가장 끝점은 반드시 도형의 밖에 있어야 하며 그 외 다른 모든 점은 도형안에 있어야만한다.
   리턴값은 분할된 도형좌표들을 담은 배열이다
   */
   // 상황검증
   let vali = !false;
   if (vali) {
      let polplp = ksttool.convert_XYX_to_PLP(pol);
      let len = glnv.length;
      let cnt_fe = 0;
      let cnt_md = 0;
      for (let i = 0; i < len; i++) {
         let rst = ksttool.checkPointIsInsidePolygon(polplp, glnv[i]);
         if (i === len - 1 || i === 0) {
            if (!rst) {
               cnt_fe++;
            }
         } else {
            if (rst) {
               cnt_md++;
            }
         }
      }
      let first_end_count = 2; // 첫과 끝점 두개를 합한 수 (첫과 끝이니 두개지)
      if (cnt_fe < first_end_count) {
         // 관통선의 가장첫 혹은 가장마지막 점이 도형의 밖이라면 null 리턴
         return null;
      }
      if (cnt_md < len - first_end_count) {
         // 관통선의 구성요소가 되는 한개이상의 점이 도형 밖에 있는 상황이다
         // 이 경우는 관통선을 분할해서 분할된 만큼 요청을 해서 재귀적으로 처리하도록 해야한다.
         let swt = false;
         let lll = [];
         let lg = [];
         for (let i = 0; i < len - 1; i++) {
            let start = glnv[i];
            let end = glnv[i + 1];
            let plpl = { first: start, second: end };
            let fer = false;
            for (let j = 0; j < polplp.length; j++) {
               if (ksttool.check_intersection_line_line(polplp[j], plpl, true)) {
                  fer = true;
                  break;
               }
            }
            if (!swt) {
               if (fer) {
                  lll[lll.length] = plpl;
                  swt = true;
               }
            } else {
               lll[lll.length] = plpl;
            }
            if (fer) {
               let fev = swt;
               swt = ksttool.checkPointIsInsidePolygon(polplp, plpl.second);
               if (!swt && fev != swt) {
                  lg[lg.length] = lll;
                  lll = [];
               }
            }
         }
         let gnv = [];
         let lns = [];
         let splt = [pol];
         for (let i = 0; i < lg.length; i++) {
            let gline = [];
            for (let ia = 0; ia < lg[i].length; ia++) {
               gline[gline.length] = lg[i][ia].first
               if ((ia === lg[i].length - 1)) {
                  gline[gline.length] = lg[i][ia].second;
               }
            }
            lns[lns.length] = gline;
         }
         for (let ia = 0; ia < lns.length; ia++) {
            let lln = lns[ia];
            let splv = [];
            while (splt.length) {
               let fey = splt.splice(0, 1)[0];
               let rt = ksttool.divide_polygon(fey, lln);
               if (rt) {
                  for (let vv = 0; vv < rt.length; vv++) {
                     splv[splv.length] = rt[vv];
                  }
               }
            }
            splt = splv;
         }
         return splt;
      }
   }
   if (true) {
      let first_line = { first: glnv[0], second: glnv[1] };
      let second_line = { first: glnv[glnv.length - 2], second: glnv[glnv.length - 1] };
      if (glnv.length >= 3) {
         let f3e = [];
         [first_line, second_line].forEach(line => {
            for (let i = 0; i < pol.length; i++) {
               let start = pol[i];
               let end = pol[(i !== pol.length - 1) ? i + 1 : 0];
               let linf = { a: line, b: { first: start, second: end } };
               let dfe = ksttool.check_intersection_line_line(linf.a, linf.b, true);
               if (dfe) {
                  f3e.push({
                     idx: i,
                     coo: dfe,
                     lnd: linf.b
                  });
               }
            }
         });
         if (f3e[0].idx === f3e[1].idx) {
            pol = JSON.parse(JSON.stringify(pol));
            pol.splice(f3e[0].idx + 1, 0, ksttool.math.get_coordinate_between_two_points(f3e[0].coo, f3e[1].coo, 0.5));
         }
      }
   }
   let mvs = [];
   for (let tw = 0; tw < 2; tw++) {
      let grp = [];
      mvs.push(grp);
      let gln = tw === 0 ? ksttool.convert_XYX_to_PLP(glnv) : ksttool.convert_XYX_to_PLP(glnv.reverse());
      gln.splice(gln.length - 1, 1);
      let han = [];
      let tmpa = null;
      let gcn = 0;
      let eln = -1;
      for (let i = 0; i < pol.length; i++) {
         let start = pol[i];
         let end = pol[(i !== pol.length - 1) ? i + 1 : 0];
         let dfe = null;
         let ln = -1;
         for (let ia = 0; ia < gln.length; ia++) {
            let linf = { a: gln[ia], b: { first: start, second: end } };
            if (!dfe) {
               dfe = ksttool.check_intersection_line_line(linf.a, linf.b, true);
               if (dfe) {
                  ln = ia;
                  break;
               }
            }
         }
         if (dfe) {
            gcn++;
            if (!tmpa) { tmpa = []; }
            if (tmpa) {
               tmpa[tmpa.length] = dfe;
               if (gcn < 2) {
                  eln = ln;
                  tmpa[tmpa.length] = end;
               }
            }
            if (gcn >= 2) {
               grp[grp.length] = tmpa;
               for (let ie = eln - 1; ie >= ln; ie--) {
                  tmpa[tmpa.length] = gln[eln - (ie + 1)].second;
                  han[han.length] = gln[ie].second;
               }
               han[han.length] = dfe;
               han[han.length] = end;
               gcn = 0;
               tmpa = null;
            }
            if (gcn === 1) {
               if (han.length === 0) {
                  han[han.length] = start;
               }
               han[han.length] = dfe;
            }
         } else {
            if (tmpa) {
               tmpa[tmpa.length] = end;
            } else {
               if (han.length === 0) {
                  han[han.length] = start;
               }
               han[han.length] = end;
            }
         }
      }
      grp[grp.length] = han;
      for (let i = 0; i < grp.length; i++) {
         if (grp[i][grp[i].length - 1].x === grp[i][0].x && grp[i][grp[i].length - 1].y === grp[i][0].y) {
            grp[i].splice(grp[i].length - 1, 1);
         }
      }
   }
   let few = -1;
   let rrrw = null;
   for (let i = 0; i < mvs.length; i++) {
      let smm = 0;
      for (let ij = 0; ij < mvs[i].length; ij++) {
         smm += mvs[i][ij].length;
      }
      if (i === 0) {
         few = smm;
      } else {
         if (few < smm) {
            rrrw = mvs[mvs.length - 1];
         } else {
            rrrw = mvs[0];
         }
      }
   }
   return rrrw;
};
ksttool.extract_XYX = function (coord, pivot) {
   // okk
   let ncood = [];
   pivot = pivot ? pivot : { x: 0, y: 0 };
   let lengt = coord.length;
   let min_x, min_y, max_x, max_y;
   for (let i = 0, len = lengt; i < len; i++) {
      if (min_x === undefined || max_x === undefined) {
         min_x = coord[i].x;
         max_x = coord[i].x;
      }
      if (min_y === undefined || max_y === undefined) {
         min_y = coord[i].y;
         max_y = coord[i].y;
      }
      if (min_x > coord[i].x) {
         min_x = coord[i].x;
      }
      if (min_y > coord[i].y) {
         min_y = coord[i].y;
      }
      if (max_x < coord[i].x) {
         max_x = coord[i].x;
      }
      if (max_y < coord[i].y) {
         max_y = coord[i].y;
      }
   }
   let width = (max_x - min_x);
   let height = (max_y - min_y);
   for (let i = 0; i < coord.length; i++) {
      let xp = width * pivot.x;
      let yp = height * pivot.y;
      ncood[ncood.length] = { x: coord[i].x - (min_x + xp), y: coord[i].y - (min_y + yp) };
   }
   return {
      path: ncood,
      width: width,
      height: height,
      pivot: pivot,
      min_x: min_x + (pivot.x * width),
      min_y: min_y + (pivot.y * height),
   };
};

ksttool.md5sum = function (string) {

   function RotateLeft(lValue, iShiftBits) {
      return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
   }

   function AddUnsigned(lX, lY) {
      var lX4, lY4, lX8, lY8, lResult;
      lX8 = (lX & 0x80000000);
      lY8 = (lY & 0x80000000);
      lX4 = (lX & 0x40000000);
      lY4 = (lY & 0x40000000);
      lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
      if (lX4 & lY4) {
         return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
      }
      if (lX4 | lY4) {
         if (lResult & 0x40000000) {
            return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
         } else {
            return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
         }
      } else {
         return (lResult ^ lX8 ^ lY8);
      }
   }

   function F(x, y, z) { return (x & y) | ((~x) & z); }
   function G(x, y, z) { return (x & z) | (y & (~z)); }
   function H(x, y, z) { return (x ^ y ^ z); }
   function I(x, y, z) { return (y ^ (x | (~z))); }

   function FF(a, b, c, d, x, s, ac) {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
   };

   function GG(a, b, c, d, x, s, ac) {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
   };

   function HH(a, b, c, d, x, s, ac) {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
   };

   function II(a, b, c, d, x, s, ac) {
      a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
      return AddUnsigned(RotateLeft(a, s), b);
   };

   function ConvertToWordArray(string) {
      var lWordCount;
      var lMessageLength = string.length;
      var lNumberOfWords_temp1 = lMessageLength + 8;
      var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
      var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
      var lWordArray = Array(lNumberOfWords - 1);
      var lBytePosition = 0;
      var lByteCount = 0;
      while (lByteCount < lMessageLength) {
         lWordCount = (lByteCount - (lByteCount % 4)) / 4;
         lBytePosition = (lByteCount % 4) * 8;
         lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
         lByteCount++;
      }
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
      lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
      lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
      return lWordArray;
   };

   function WordToHex(lValue) {
      var WordToHexValue = "", WordToHexValue_temp = "", lByte, lCount;
      for (lCount = 0; lCount <= 3; lCount++) {
         lByte = (lValue >>> (lCount * 8)) & 255;
         WordToHexValue_temp = "0" + lByte.toString(16);
         WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
      }
      return WordToHexValue;
   };

   function Utf8Encode(string) {
      string = string.replace(/\r\n/g, "\n");
      var utftext = "";

      for (var n = 0; n < string.length; n++) {

         var c = string.charCodeAt(n);

         if (c < 128) {
            utftext += String.fromCharCode(c);
         }
         else if ((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
         }
         else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
         }

      }

      return utftext;
   };

   var x = Array();
   var k, AA, BB, CC, DD, a, b, c, d;
   var S11 = 7, S12 = 12, S13 = 17, S14 = 22;
   var S21 = 5, S22 = 9, S23 = 14, S24 = 20;
   var S31 = 4, S32 = 11, S33 = 16, S34 = 23;
   var S41 = 6, S42 = 10, S43 = 15, S44 = 21;

   string = Utf8Encode(string);

   x = ConvertToWordArray(string);

   a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

   for (k = 0; k < x.length; k += 16) {
      AA = a; BB = b; CC = c; DD = d;
      a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
      d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
      c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
      b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
      a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
      d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
      c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
      b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
      a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
      d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
      c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
      b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
      a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
      d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
      c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
      b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
      a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
      d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
      c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
      b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
      a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
      d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
      c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
      b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
      a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
      d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
      c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
      b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
      a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
      d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
      c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
      b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
      a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
      d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
      c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
      b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
      a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
      d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
      c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
      b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
      a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
      d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
      c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
      b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
      a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
      d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
      c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
      b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
      a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
      d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
      c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
      b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
      a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
      d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
      c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
      b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
      a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
      d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
      c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
      b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
      a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
      d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
      c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
      b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
      a = AddUnsigned(a, AA);
      b = AddUnsigned(b, BB);
      c = AddUnsigned(c, CC);
      d = AddUnsigned(d, DD);
   }

   var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);

   return temp.toLowerCase();
};
ksttool.find_center_point_of_polygon = function (polygon_as_xyx) {
   if (false) {
      // 인자로는 이런거 주면 된다.
      [
         { "x": 0, "y": 0 },
         { "x": 0, "y": 100 },
         { "x": 100, "y": 100 },
         { "x": 100, "y": 0 },
      ];
   }
   let points = polygon_as_xyx;
   let this_points = points || [];
   let this_length = points.length;
   let area = 0, x = 0, y = 0, i, j, f, point1, point2;
   for (i = 0, j = this_length - 1; i < this_length; j = i, i += 1) {
      point1 = this_points[i];
      point2 = this_points[j];
      f = point1.x * point2.y - point2.x * point1.y;
      x += (point1.x + point2.x) * f;
      y += (point1.y + point2.y) * f;
   }
   for (i = 0, j = this_length - 1; i < this_length; j = i, i += 1) {
      point1 = this_points[i];
      point2 = this_points[j];
      area += point1.x * point2.y;
      area -= point1.y * point2.x;
   }
   area /= 2;
   f = area * 6;
   return { x: x / f, y: y / f };
};
ksttool.is_included_in_list = function (list, obj) {
   for (let i = 0, len = list.length; i < len; i++) {
      if (list[i] === obj) {
         return true;
      }
   }
   return false;
};




ksttool.polyInter = function (poly1, poly2) {
   // 절묘하게 선이 끝에 닿는경우에 대해서 생각해봐야한다.
   for (let i1 = 0, len1 = poly1.length; i1 < len1; i1++) {
      for (let i2 = 0, len2 = poly2.length; i2 < len2; i2++) {
         if (ksttool.check_intersection_line_line(poly1[i1], poly2[i2], true)) {
            return true;
         }
      }
   }
};


